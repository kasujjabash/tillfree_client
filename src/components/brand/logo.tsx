import { cn } from "@/lib/utils";

/**
 * Unified OS mark: four modules joined into one square — the platform as the
 * frame that holds an organisation's operations. Drawn, not an icon font.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-6", className)}>
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <rect x="6" y="6" width="5" height="5" rx="1.25" fill="white" />
      <rect x="13" y="6" width="5" height="5" rx="1.25" fill="white" fillOpacity="0.55" />
      <rect x="6" y="13" width="5" height="5" rx="1.25" fill="white" fillOpacity="0.55" />
      <rect x="13" y="13" width="5" height="5" rx="1.25" fill="white" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">Unified OS</span>
    </span>
  );
}
