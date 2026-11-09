import Link from "next/link";

import { Wordmark } from "@/components/brand/logo";

/** Frame for sign-in, recovery and organisation selection: brand, one centred column, quiet footer. */
export function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center px-5 sm:px-8">
        <Link href="/" className="rounded-md" aria-label="Unified OS home">
          <Wordmark />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16 sm:pt-[12vh]">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 pb-6 text-meta text-muted-foreground">
        <span>Unified OS</span>
        <span aria-hidden>·</span>
        <span>One platform. Every operation. Room to grow.</span>
      </footer>
    </div>
  );
}
