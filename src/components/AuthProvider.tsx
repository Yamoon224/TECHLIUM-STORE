"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  TOKEN_STORAGE_KEY,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type User,
} from "@/lib/auth";

type SessionStatus = "checking" | "ready";

interface AuthContextValue {
  status: SessionStatus;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, locale?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasStoredToken] = useState(
    () => typeof window !== "undefined" && Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)),
  );
  const [status, setStatus] = useState<SessionStatus>(hasStoredToken ? "checking" : "ready");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!hasStoredToken) {
      return;
    }

    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      return;
    }

    fetchCurrentUser(stored)
      .then((fetchedUser) => {
        setToken(stored);
        setUser(fetchedUser);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setStatus("ready"));
  }, [hasStoredToken]);

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password, "TechniLium-store-web");
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function register(name: string, email: string, password: string, locale?: string) {
    await registerRequest(name, email, password, locale);
    await login(email, password);
  }

  async function logout() {
    if (token) {
      await logoutRequest(token).catch(() => undefined);
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ status, token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
