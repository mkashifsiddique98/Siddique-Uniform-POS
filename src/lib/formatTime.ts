// One place for date/time formatting so the server, the browser, screens and printed receipts all agree.
// A fixed locale and the shop's time zone mean the text never depends on where the code runs.
export const SHOP_LOCALE = "en-PK";
export const SHOP_TIME_ZONE = "Asia/Karachi";

type DateInput = Date | string | number;

const toDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value));

export function formatShopDate(value: DateInput): string {
  return toDate(value).toLocaleDateString(SHOP_LOCALE, { timeZone: SHOP_TIME_ZONE });
}

export function formatShopTime(value: DateInput): string {
  return toDate(value).toLocaleTimeString(SHOP_LOCALE, {
    timeZone: SHOP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatShopDateTime(value: DateInput): string {
  return `${formatShopDate(value)} ${formatShopTime(value)}`;
}

// "dd MMM yyyy, hh:mm a" in the shop time zone, built from parts so the text is identical on server and browser.
export function formatShopStamp(value: DateInput): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(toDate(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}`;
}

// A stored return time, or a clear note for legacy returns that never recorded one.
export function formatReturnTime(value?: DateInput | null): string {
  if (!value) return "time not recorded";
  const date = toDate(value);
  return Number.isNaN(date.getTime()) ? "time not recorded" : formatShopStamp(date);
}
