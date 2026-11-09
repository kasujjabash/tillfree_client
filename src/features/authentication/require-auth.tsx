"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullPageLoader } from "@/components/feedback/full-page-loader";
import { useAuth } from "./auth-provider";

/**
 * Client-side route guard. It only decides what to *render*; it is not a
 * security boundary. Every API call is authenticated and authorised by Django,
 * so a bypassed guard yields empty, failing screens rather than data.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated") return <FullPageLoader label="Checking your session" />;
  return <>{children}</>;
}

/** Inverse guard for sign-in pages: signed-in users skip straight to their workspace. */
export function RedirectIfAuthenticated({ to, children }: { to: string; children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace(to);
  }, [status, router, to]);

  if (status === "loading" || status === "authenticated") return <FullPageLoader label="Checking your session" />;
  return <>{children}</>;
}
