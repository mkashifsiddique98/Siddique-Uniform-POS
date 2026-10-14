import { z } from "zod";

// The shop runs in Asia/Karachi (UTC+5, no daylight saving). Day boundaries are computed with this fixed offset
// so the result never depends on the server's own time zone.
export const SHOP_UTC_OFFSET_MINUTES = 5 * 60;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MAX_CUSTOM_DAYS = 366;

export const DASHBOARD_RANGES = ["today", "7d", "30d", "month", "custom"] as const;
export type DashboardRangeKey = (typeof DASHBOARD_RANGES)[number];

const dayString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const dashboardQuerySchema = z
  .object({
    range: z.enum(DASHBOARD_RANGES).default("today"),
    from: dayString.optional(),
    to: dayString.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.range !== "custom") return;
    if (!value.from || !value.to) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "from and to are required for a custom range" });
      return;
    }
    const from = parseShopDay(value.from);
    const to = parseShopDay(value.to);
    if (from === null || to === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return;
    }
    if (to < from) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "from must not be after to" });
    } else if ((to - from) / DAY_MS + 1 > MAX_CUSTOM_DAYS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Range cannot exceed ${MAX_CUSTOM_DAYS} days` });
    }
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export type DateWindow = { from: Date; to: Date };
export type ResolvedRange = { key: DashboardRangeKey; current: DateWindow; previous: DateWindow };

// Start (UTC instant) of the shop day containing `instant`
export function startOfShopDay(instant: Date): Date {
  const offsetMs = SHOP_UTC_OFFSET_MINUTES * MINUTE_MS;
  const shifted = instant.getTime() + offsetMs;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - offsetMs);
}

// "YYYY-MM-DD" in the shop calendar -> start of that shop day, or null when it is not a real date
export function parseShopDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return utc - SHOP_UTC_OFFSET_MINUTES * MINUTE_MS;
}

function startOfShopMonth(instant: Date, monthDelta = 0): Date {
  const shifted = new Date(instant.getTime() + SHOP_UTC_OFFSET_MINUTES * MINUTE_MS);
  const utc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + monthDelta, 1);
  return new Date(utc - SHOP_UTC_OFFSET_MINUTES * MINUTE_MS);
}

// `to` is always exclusive. Today, 7d, 30d and month end at the start of tomorrow, so every window is "up to now".
export function resolveDashboardRange(query: DashboardQuery, now: Date = new Date()): ResolvedRange {
  const todayStart = startOfShopDay(now);
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);

  let from: Date;
  let to: Date = tomorrowStart;

  switch (query.range) {
    case "today":
      from = todayStart;
      break;
    case "7d":
      from = new Date(todayStart.getTime() - 6 * DAY_MS);
      break;
    case "30d":
      from = new Date(todayStart.getTime() - 29 * DAY_MS);
      break;
    case "month":
      from = startOfShopMonth(now);
      break;
    case "custom": {
      const fromMs = parseShopDay(query.from ?? "");
      const toMs = parseShopDay(query.to ?? "");
      if (fromMs === null || toMs === null) throw new Error("Invalid custom range");
      from = new Date(fromMs);
      to = new Date(toMs + DAY_MS);
      break;
    }
  }

  return { key: query.range, current: { from, to }, previous: previousWindow(query.range, { from, to }, now) };
}

// The comparison window has the same length and ends where the current one starts.
// For "month" it is the previous calendar month, cut to the same number of elapsed days.
export function previousWindow(key: DashboardRangeKey, current: DateWindow, now: Date = new Date()): DateWindow {
  if (key === "month") {
    const prevFrom = startOfShopMonth(current.from, -1);
    const elapsed = current.to.getTime() - current.from.getTime();
    const prevTo = new Date(Math.min(prevFrom.getTime() + elapsed, current.from.getTime()));
    return { from: prevFrom, to: prevTo };
  }
  const length = current.to.getTime() - current.from.getTime();
  return { from: new Date(current.from.getTime() - length), to: new Date(current.from.getTime()) };
}

export type Comparison = {
  current: number;
  previous: number;
  change: number;
  // null when there is nothing to compare with (previous is 0)
  changePct: number | null;
  direction: "up" | "down" | "flat";
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export function compareValues(current: number, previous: number): Comparison {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safePrevious = Number.isFinite(previous) ? previous : 0;
  const change = round2(safeCurrent - safePrevious);
  return {
    current: round2(safeCurrent),
    previous: round2(safePrevious),
    change,
    changePct: safePrevious === 0 ? null : round2((change / Math.abs(safePrevious)) * 100),
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

// Fills days with no sales so the chart line has no gaps. Keys are shop-calendar days (YYYY-MM-DD).
export function fillDailySeries(
  rows: { date: string; sales: number; invoices: number }[],
  window: DateWindow
): { date: string; sales: number; invoices: number }[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const series: { date: string; sales: number; invoices: number }[] = [];
  for (let t = window.from.getTime(); t < window.to.getTime(); t += DAY_MS) {
    const date = new Date(t + SHOP_UTC_OFFSET_MINUTES * MINUTE_MS).toISOString().slice(0, 10);
    const row = byDate.get(date);
    series.push({ date, sales: round2(row?.sales ?? 0), invoices: row?.invoices ?? 0 });
  }
  return series;
}
