"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "checking" | "ok" | "down";

const TIMEOUT_MS = 5_000;      // treat no answer in 5 s as down

export default function HealthButton({
  className = "",
  compact = false,      // smaller pill for a top nav
  hideWhenOk = false,   // true = only show the button when something is wrong (red)
}: {
  className?: string;
  compact?: boolean;
  hideWhenOk?: boolean;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState("Checking system...");

  const check = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch("/api/health", { cache: "no-store", signal: controller.signal });
      if (res.ok) {
        setStatus("ok");
        setDetail(`System OK • checked ${new Date().toLocaleTimeString()}`);
      } else {
        const body = await res.json().catch(() => null);
        const failed = body?.checks
          ? Object.entries(body.checks).filter(([, v]: any) => !v.ok).map(([k]) => k).join(", ")
          : `HTTP ${res.status}`;
        setStatus("down");
        setDetail(`Problem: ${failed || "unknown"} • ${new Date().toLocaleTimeString()}`);
      }
    } catch {
      setStatus("down");
      setDetail(`Server not responding • ${new Date().toLocaleTimeString()}`);
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const color =
    status === "ok" ? "bg-green-600 hover:bg-green-700"
    : status === "down" ? "bg-red-600 hover:bg-red-700"
    : "bg-gray-400";

  const label = status === "ok" ? "System OK" : status === "down" ? "System Down" : "Checking...";

  if (hideWhenOk && status !== "down") return null;

  const size = compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={check}              // click = check again now
      title={detail}
      className={`flex items-center gap-2 rounded-md font-medium text-white transition-colors ${size} ${color} ${className}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full bg-white ${status === "down" ? "animate-pulse" : ""}`} />
      {label}
    </button>
  );
}