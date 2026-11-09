import { initials } from "@/lib/formatting";
import { cn } from "@/lib/utils";

/**
 * Organisation identity tile. Hue is derived from the id so organisations are
 * distinguishable in the switcher; saturation stays low so it never competes
 * with status colours.
 */
export function OrganisationAvatar({
  id,
  name,
  size = "md",
  className,
}: {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white",
        size === "sm" && "size-5 text-[10px]",
        size === "md" && "size-6 text-[11px]",
        size === "lg" && "size-9 text-[13px]",
        className,
      )}
      style={{ backgroundColor: `oklch(0.5 0.09 ${hue})` }}
    >
      {initials(name)}
    </span>
  );
}
