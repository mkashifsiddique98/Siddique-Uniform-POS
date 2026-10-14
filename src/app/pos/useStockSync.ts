"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AUTO_REFRESH_INTERVAL_MS,
  AUTO_REFRESH_MIN_GAP_MS,
  stockRefreshGate,
} from "@/lib/stockRefresh";

// Re-runs the server component so the product list (and its stock) is fetched again.
// Throttled to once every 3 seconds and ignored while a refresh is still in flight.
export function useStockSync() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const startedHere = useRef(false);

  useEffect(() => {
    if (!isPending && startedHere.current) {
      startedHere.current = false;
      stockRefreshGate.finish();
    }
  }, [isPending]);

  // minGapMs lets automatic triggers ask for a longer pause than the 3s default
  const refreshStock = useCallback(
    (minGapMs?: number): boolean => {
      if (!stockRefreshGate.tryStart(minGapMs)) return false;
      startedHere.current = true;
      startTransition(() => router.refresh());
      return true;
    },
    [router]
  );

  return { refreshStock };
}

// Keeps stock fresh for multiple cashiers: refresh on tab focus (at most every 10s) and every 30s
// while the tab is visible and no save is running. Mount it once.
export function useAutoStockRefresh() {
  const { refreshStock } = useStockSync();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const visible = () => document.visibilityState === "visible";

    const stopTimer = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const startTimer = () => {
      stopTimer();
      timer = setInterval(() => {
        if (visible() && !stockRefreshGate.isSaving()) refreshStock();
      }, AUTO_REFRESH_INTERVAL_MS);
    };
    const onFocusLike = () => {
      if (visible() && !stockRefreshGate.isSaving()) refreshStock(AUTO_REFRESH_MIN_GAP_MS);
    };
    const onVisibility = () => {
      if (visible()) {
        onFocusLike();
        startTimer();
      } else {
        stopTimer();
      }
    };

    if (visible()) startTimer();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocusLike);

    // Cleanup runs between Strict Mode's double mount, so listeners and timers are never doubled
    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocusLike);
    };
  }, [refreshStock]);
}
