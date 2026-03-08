import { useEffect, useState } from "react";
import { api } from "../lib/api";

const TOKEN_KEY = "tara-maa-admin-token";
const EMAIL_KEY = "tara-maa-admin-email";

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [email, setEmail] = useState(localStorage.getItem(EMAIL_KEY) || "");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    api.getProfile(token)
      .then((data) => {
        if (!cancelled) {
          setProfile(data.admin || data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function saveSession(nextToken, nextEmail, nextProfile) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(EMAIL_KEY, nextEmail);
    setToken(nextToken);
    setEmail(nextEmail);
    setProfile(nextProfile || null);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken("");
    setEmail("");
    setProfile(null);
    setLoadingProfile(false);
  }

  return {
    token,
    email,
    profile,
    loadingProfile,
    isAuthenticated: Boolean(token),
    saveSession,
    logout,
    setEmail
  };
}
