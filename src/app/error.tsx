"use client";

import { ErrorState } from "@/components/feedback/states";

/** Catches errors thrown by the workspace shell itself (sidebar, top bar), above the per-page boundary. */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState size="page" title="Unified OS hit a problem" error={error} onRetry={reset} />;
}
