"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "../lib/auth";

export function useAdminAuth() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(getAccessToken()));
    setIsReady(true);
  }, []);

  return { isAuthenticated, isReady };
}
