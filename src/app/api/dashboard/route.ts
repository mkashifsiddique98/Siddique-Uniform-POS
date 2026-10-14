import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/utils/connectDB";
import { requireAuth } from "@/lib/auth";
import { TtlCache } from "@/lib/ttlCache";
import { dashboardQuerySchema, resolveDashboardRange } from "@/lib/dashboardRange";
import { DASHBOARD_SECTIONS, getDashboardSection, stripAdminFields } from "@/lib/dashboardService";

const sectionSchema = z.object({ section: z.enum(DASHBOARD_SECTIONS) });

const CACHE_TTL_MS = 45 * 1000;
const cache = new TtlCache<unknown>(CACHE_TTL_MS, 200);

// GET /api/dashboard?section=kpis|trend|schools|products|overdue|reorder&range=today|7d|30d|month|custom&from=&to=
// Each widget asks for its own section so it can load, fail and retry on its own.
export async function GET(req: Request) {
  const auth = await requireAuth(req, { page: "dashboard" });
  if (!auth.ok) return auth.response;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const section = sectionSchema.safeParse(params);
  const query = dashboardQuerySchema.safeParse(params);
  if (!section.success) {
    return NextResponse.json({ error: section.error.issues[0]?.message || "Invalid section" }, { status: 400 });
  }
  if (!query.success) {
    return NextResponse.json({ error: query.error.issues[0]?.message || "Invalid query" }, { status: 400 });
  }

  const isAdmin = auth.user.role?.toLowerCase() === "admin";
  const range = resolveDashboardRange(query.data);
  // The cache is split by tier, so a payload built for an admin can never be served to anyone else
  const cacheKey = [
    isAdmin ? "admin" : "staff",
    section.data.section,
    query.data.range,
    query.data.from ?? "",
    query.data.to ?? "",
  ].join("|");

  try {
    let data = cache.get(cacheKey);
    if (data === undefined) {
      await connectDB();
      data = await getDashboardSection(section.data.section, range, isAdmin);
      cache.set(cacheKey, data);
    }
    return NextResponse.json(
      {
        range: {
          key: range.key,
          from: range.current.from,
          to: range.current.to,
          previousFrom: range.previous.from,
          previousTo: range.previous.to,
        },
        isAdmin,
        data: stripAdminFields(data, isAdmin),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Dashboard query failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to load dashboard data" }, { status: 500 });
  }
}
