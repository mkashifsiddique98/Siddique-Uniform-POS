import {
  AUTO_REFRESH_MIN_GAP_MS,
  MIN_REFRESH_INTERVAL_MS,
  createRefreshGate,
} from "../stockRefresh";

describe("refresh gate (throttle)", () => {
  let time = 1_000_000;
  const gate = () => createRefreshGate(MIN_REFRESH_INTERVAL_MS, () => time);

  beforeEach(() => {
    time = 1_000_000;
  });

  test("the first call is allowed", () => {
    expect(gate().tryStart()).toBe(true);
  });

  test("a call while one is in flight is ignored", () => {
    const g = gate();
    expect(g.tryStart()).toBe(true);
    time += 5000;
    expect(g.tryStart()).toBe(false);
  });

  test("a call within 3 seconds of the last one is ignored even after it finished", () => {
    const g = gate();
    g.tryStart();
    g.finish();
    time += 2999;
    expect(g.tryStart()).toBe(false);
    time += 1;
    expect(g.tryStart()).toBe(true);
  });

  test("runs at most once per 3 seconds under a burst of calls", () => {
    const g = gate();
    let runs = 0;
    for (let i = 0; i < 30; i++) {
      if (g.tryStart()) {
        runs += 1;
        g.finish();
      }
      time += 100;
    }
    expect(runs).toBe(1);
  });

  test("automatic focus refreshes need a 10 second gap", () => {
    const g = gate();
    g.tryStart();
    g.finish();
    time += 9000;
    expect(g.tryStart(AUTO_REFRESH_MIN_GAP_MS)).toBe(false);
    time += 1000;
    expect(g.tryStart(AUTO_REFRESH_MIN_GAP_MS)).toBe(true);
  });

  test("a refresh that never finishes does not block forever", () => {
    const g = gate();
    g.tryStart();
    time += 10_000;
    expect(g.tryStart()).toBe(true);
  });

  test("tracks saves in progress so the timer can skip them", () => {
    const g = gate();
    expect(g.isSaving()).toBe(false);
    g.beginSave();
    expect(g.isSaving()).toBe(true);
    g.endSave();
    g.endSave();
    expect(g.isSaving()).toBe(false);
  });
});
