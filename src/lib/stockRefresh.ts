// Throttle for refreshing the POS product list (stock). One shared gate per browser tab, so every
// trigger (after a save, tab focus, the 30s timer) respects the same limits.

export const MIN_REFRESH_INTERVAL_MS = 3000;
export const AUTO_REFRESH_MIN_GAP_MS = 10000;
export const AUTO_REFRESH_INTERVAL_MS = 30000;
// A refresh that never reports completion must not block the gate forever
const IN_FLIGHT_TIMEOUT_MS = 10000;

export interface RefreshGate {
  // Returns true when the caller may refresh now (and marks a refresh as started)
  tryStart(minGapMs?: number): boolean;
  // Call when the refresh has finished
  finish(): void;
  beginSave(): void;
  endSave(): void;
  isSaving(): boolean;
  reset(): void;
}

export function createRefreshGate(
  minIntervalMs = MIN_REFRESH_INTERVAL_MS,
  now: () => number = Date.now
): RefreshGate {
  let lastStart = -Infinity;
  let inFlight = false;
  let saves = 0;

  return {
    tryStart(minGapMs = minIntervalMs) {
      const time = now();
      if (inFlight && time - lastStart < IN_FLIGHT_TIMEOUT_MS) return false;
      if (time - lastStart < Math.max(minGapMs, minIntervalMs)) return false;
      lastStart = time;
      inFlight = true;
      return true;
    },
    finish() {
      inFlight = false;
    },
    beginSave() {
      saves += 1;
    },
    endSave() {
      saves = Math.max(0, saves - 1);
    },
    isSaving() {
      return saves > 0;
    },
    reset() {
      lastStart = -Infinity;
      inFlight = false;
      saves = 0;
    },
  };
}

export const stockRefreshGate = createRefreshGate();
