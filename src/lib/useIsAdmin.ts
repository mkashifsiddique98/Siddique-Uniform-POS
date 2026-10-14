"use client";

import { useEffect, useState } from "react";

// Whether the signed-in user is an admin. The server still enforces the role; this only drives the UI.
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/users/user-info")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setIsAdmin(String(data?.role || "").toLowerCase() === "admin");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}
