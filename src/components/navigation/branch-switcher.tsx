"use client";

import { Check, ChevronDown, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/features/workspace/workspace-provider";

/**
 * Sets the branch in focus for lists and summaries. Only branches the member
 * is assigned to are offered; "All branches" only when a role covers them all.
 * Hidden entirely for single-branch members with nothing to choose.
 */
export function BranchSwitcher() {
  const { branches, allBranches, activeBranch, setActiveBranchId } = useWorkspace();
  if (branches.length === 0) return null;
  const label = activeBranch?.name ?? "All branches";

  if (branches.length === 1 && !allBranches) {
    return (
      <span className="hidden items-center gap-1.5 px-2 text-label font-normal text-muted-foreground sm:inline-flex">
        <MapPin className="size-3.5" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" aria-label={`Branch: ${label}. Change branch`}>
          <MapPin aria-hidden />
          <span className="max-w-36 truncate text-foreground">{label}</span>
          <ChevronDown className="size-3!" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-meta font-normal text-muted-foreground">Show data for</DropdownMenuLabel>
        {allBranches && (
          <>
            <DropdownMenuItem onSelect={() => setActiveBranchId(null)}>
              <span className="flex-1">All branches</span>
              {!activeBranch && <Check className="text-primary" aria-hidden />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {branches.map((b) => (
          <DropdownMenuItem key={b.id} onSelect={() => setActiveBranchId(b.id)}>
            <span className="flex-1 truncate">{b.name}</span>
            <span className="font-mono text-meta text-muted-foreground">{b.code}</span>
            {activeBranch?.id === b.id && <Check className="text-primary" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
