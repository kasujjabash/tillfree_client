"use client";

import { ErrorState } from "@/components/feedback/states";

/** Render errors inside a workspace page keep the shell (navigation) usable. */
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState size="page" title="This page hit a problem" error={error} onRetry={reset} />;
}
