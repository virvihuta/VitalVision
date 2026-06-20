import { useEffect, useState, useCallback } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  TOKEN_KEY,
  USER_KEY,
} from "../api/backendApi";
import type { CurrentUser } from "../types";

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((fn) => fn());
}

function readUser(): CurrentUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(readUser);
  const [token, setToken] = useState<string | null>(readToken);

  useEffect(() => {
    const sync = () => {
      setUser(readUser());
      setToken(readToken());
    };
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    notify();
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      inviteCode: string,
      hospital: string = "QSUT Tirana"
    ) => {
      const res = await apiRegister(name, email, password, inviteCode, hospital);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      notify();
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notify();
  }, []);

  return { user, token, login, logout, register };
}
