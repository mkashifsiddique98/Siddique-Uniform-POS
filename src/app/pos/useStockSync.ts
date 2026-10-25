"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AUTO_REFRESH_INTERVAL_MS,
  AUTO_REFRESH_MIN_GAP_MS,
  FULL_REFRESH_INTERVAL_MS,
  stockRefreshGate,
} from "@/lib/stockRefresh";
import type { StockRow } from "@/lib/stockMerge";

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

// Keeps stock fresh for multiple cashiers: on tab focus (at most every 10s) and every 30s while the tab is
// visible and no save is running. Mount it once.
// With `applyStock`, only /api/product/stock is fetched and the list is updated in place. A full router refresh
// still runs every FULL_REFRESH_INTERVAL_MS (prices, names, new products) and whenever products were added or removed.
export function useAutoStockRefresh(applyStock?: (rows: StockRow[]) => boolean) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { refreshStock } = useStockSync();
  const applyRef = useRef(applyStock);
  applyRef.current = applyStock;
  const lastFullRefresh = useRef(Date.now());

  const refreshInPlace = useCallback(
    async (minGapMs?: number) => {
      const apply = applyRef.current;
      if (!apply || Date.now() - lastFullRefresh.current >= FULL_REFRESH_INTERVAL_MS) {
        if (refreshStock(minGapMs)) lastFullRefresh.current = Date.now();
        return;
      }
      if (!stockRefreshGate.tryStart(minGapMs)) return;
      try {
        const res = await fetch("/api/product/stock", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        // A save began while this was in flight: its numbers may predate the sale, so drop them
        if (!Array.isArray(data?.response) || stockRefreshGate.isSaving()) return;
        if (!apply(data.response)) {
          lastFullRefresh.current = Date.now();
          startTransition(() => router.refresh());
        }
      } catch (error) {
        console.error("Stock refresh failed:", error);
      } finally {
        stockRefreshGate.finish();
      }
    },
    [refreshStock, router]
  );

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
        if (visible() && !stockRefreshGate.isSaving()) refreshInPlace();
      }, AUTO_REFRESH_INTERVAL_MS);
    };
    const onFocusLike = () => {
      if (visible() && !stockRefreshGate.isSaving()) refreshInPlace(AUTO_REFRESH_MIN_GAP_MS);
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
  }, [refreshInPlace]);
}
