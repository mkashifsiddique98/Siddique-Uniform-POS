import type { Server } from "http";

export const DEFAULT_SLOW_REQUEST_MS = 300;

type Options = {
  thresholdMs?: number;
  log?: (message: string) => void;
  now?: () => number;
};

// Times every /api request from arrival to response finish and logs the ones over the threshold.
// Patches Server.prototype.emit, so no route needs to change. Returns a function that undoes the patch.
export function installSlowRequestLogger(
  serverClass: { prototype: Pick<Server, "emit"> },
  { thresholdMs = DEFAULT_SLOW_REQUEST_MS, log = console.warn, now = Date.now }: Options = {}
): () => void {
  const proto = serverClass.prototype as any;
  const originalEmit = proto.emit;

  proto.emit = function (this: unknown, event: string, ...args: any[]) {
    if (event === "request") {
      const [req, res] = args;
      const url: string = req?.url || "";
      if (url.startsWith("/api/") && res?.once) {
        const start = now();
        res.once("close", () => {
          const ms = now() - start;
          if (ms > thresholdMs) {
            log(`[slow-request] ${req.method} ${url.split("?")[0]} ${res.statusCode} ${ms}ms`);
          }
        });
      }
    }
    return originalEmit.apply(this, [event, ...args]);
  };

  return () => {
    proto.emit = originalEmit;
  };
}
