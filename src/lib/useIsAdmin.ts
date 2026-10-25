"use client";

import { useEffect, useState } from "react";
import { fetchUserInfo } from "@/lib/userInfo";
// Whether the signed-in user is an admin. The server still enforces the role; this only drives the UI.
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    fetchUserInfo().then((data) => {
      if (active) setIsAdmin(String(data?.role || "").toLowerCase() === "admin");
    });
    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}
