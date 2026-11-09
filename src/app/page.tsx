"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullPageLoader } from "@/components/feedback/full-page-loader";
import { useAuth } from "@/features/authentication/auth-provider";

/** Entry point: signed-in users go to organisation selection, everyone else to sign in. */
export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/select-organisation");
    if (status === "unauthenticated") router.replace("/sign-in");
  }, [status, router]);

  return <FullPageLoader label="Loading Unified OS" />;
}
