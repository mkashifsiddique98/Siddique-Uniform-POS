import http from "http";
import { installSlowRequestLogger, DEFAULT_SLOW_REQUEST_MS } from "@/lib/slowRequestLog";

// Node-only part of instrumentation.ts, kept in its own file so the edge bundle never sees the "http" import.
export function registerSlowRequestLogger() {
  const thresholdMs = Number(process.env.SLOW_REQUEST_MS) || DEFAULT_SLOW_REQUEST_MS;
  installSlowRequestLogger(http.Server, { thresholdMs });
  console.warn(`[slow-request] logging /api requests slower than ${thresholdMs}ms`);
}
