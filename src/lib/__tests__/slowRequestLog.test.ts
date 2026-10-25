import { EventEmitter } from "events";
import { installSlowRequestLogger } from "../slowRequestLog";

class FakeServer extends EventEmitter {}

function fakeResponse(statusCode = 200) {
  const res: any = new EventEmitter();
  res.statusCode = statusCode;
  return res;
}

describe("installSlowRequestLogger", () => {
  it("logs only slow /api requests", () => {
    let t = 0;
    const logs: string[] = [];
    const restore = installSlowRequestLogger(FakeServer as any, {
      thresholdMs: 300,
      log: (m) => logs.push(m),
      now: () => t,
    });
    const server = new FakeServer();
    server.on("request", () => undefined);

    const slow = fakeResponse(200);
    server.emit("request", { method: "GET", url: "/api/invoice?x=1" }, slow);
    t = 450;
    slow.emit("close");

    t = 500;
    const fast = fakeResponse();
    server.emit("request", { method: "GET", url: "/api/product" }, fast);
    t = 600;
    fast.emit("close");

    const page = fakeResponse();
    server.emit("request", { method: "GET", url: "/pos" }, page);
    t = 5000;
    page.emit("close");

    expect(logs).toEqual(["[slow-request] GET /api/invoice 200 450ms"]);
    restore();
  });

  it("restores the original emit and still delivers events", () => {
    const original = FakeServer.prototype.emit;
    const restore = installSlowRequestLogger(FakeServer as any);
    const server = new FakeServer();
    let got = false;
    server.on("request", () => (got = true));
    server.emit("request", { method: "GET", url: "/api/x" }, fakeResponse());
    expect(got).toBe(true);
    restore();
    expect(FakeServer.prototype.emit).toBe(original);
  });
});
