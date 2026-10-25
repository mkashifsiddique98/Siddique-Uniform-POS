// Opt-in: set SLOW_REQUEST_LOG=1 (and optionally SLOW_REQUEST_MS) to log slow /api requests to the PM2 logs.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SLOW_REQUEST_LOG === "1") {
    const { registerSlowRequestLogger } = await import("./instrumentation-node");
    registerSlowRequestLogger();
  }
}
