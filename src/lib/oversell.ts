import type { ClientSession } from "mongoose";
import Setting from "@/models/setting";

export type OversellMode = "clamp" | "block";

export const SETTINGS_ID = "pos";

export const normalizeOversellMode = (value: unknown): OversellMode | undefined =>
  value === "block" ? "block" : value === "clamp" ? "clamp" : undefined;

// A per-product override wins over the shop setting; the default is "clamp".
export const effectiveOversellMode = (productMode: unknown, globalMode: unknown): OversellMode =>
  normalizeOversellMode(productMode) ?? normalizeOversellMode(globalMode) ?? "clamp";

export async function getGlobalOversellMode(session?: ClientSession | null): Promise<OversellMode> {
  const doc: any = await Setting.findOne({ _id: SETTINGS_ID }).session(session || null).lean();
  return normalizeOversellMode(doc?.oversellMode) ?? "clamp";
}
