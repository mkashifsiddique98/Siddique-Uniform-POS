// Opt-in: set SLOW_REQUEST_LOG=1 (and optionally SLOW_REQUEST_MS) to log slow /api requests to the PM2 logs.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.SLOW_REQUEST_LOG !== "1") return;

  const http = await import("http");
  const { installSlowRequestLogger, DEFAULT_SLOW_REQUEST_MS } = await import(
    "@/lib/slowRequestLog"
  );
  const thresholdMs = Number(process.env.SLOW_REQUEST_MS) || DEFAULT_SLOW_REQUEST_MS;
  installSlowRequestLogger(http.Server, { thresholdMs });
  console.warn(`[slow-request] logging /api requests slower than ${thresholdMs}ms`);
}
