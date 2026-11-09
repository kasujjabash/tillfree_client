import { LogoMark } from "@/components/brand/logo";

export function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <LogoMark className="size-7 animate-pulse" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
