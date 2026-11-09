"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { endSession, onSessionEnded, refreshAccessToken, setAccessToken } from "@/lib/auth/session";
import type { User } from "@/types/api";
import { getMe, login, logout } from "./api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Restore the session on load: the refresh cookie (if any) yields a new access token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await refreshAccessToken();
      if (!ok) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A failed refresh anywhere in the app ends the session here.
  useEffect(
    () =>
      onSessionEnded((reason) => {
        // Drop every cached response so nothing from this session can render again.
        queryClient.clear();
        setUser(null);
        setStatus("unauthenticated");
        if (reason === "expired") {
          const next = encodeURIComponent(pathnameRef.current);
          router.replace(`/sign-in?reason=session_expired&next=${next}`);
        } else {
          router.replace("/sign-in");
        }
      }),
    [queryClient, router],
  );

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const { access } = await login(input);
    setAccessToken(access);
    const me = await getMe();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      endSession("signed_out");
    }
  }, []);

  const value = useMemo(() => ({ status, user, signIn, signOut }), [status, user, signIn, signOut]);
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Same as useAuth, but asserts a signed-in user. Use below <RequireAuth>. */
export function useCurrentUser() {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser called without a signed-in user");
  return user;
}
