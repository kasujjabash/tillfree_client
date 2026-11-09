"use client";

import { BookOpen, CircleHelp, Keyboard, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { docsUrl, supportUrl } from "@/config/env";

/** Links appear only when configured; no placeholder destinations. */
export function HelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="Help and support">
          <CircleHelp aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-meta font-normal text-muted-foreground">Help</DropdownMenuLabel>
        {docsUrl && (
          <DropdownMenuItem asChild>
            <a href={docsUrl} target="_blank" rel="noreferrer">
              <BookOpen aria-hidden />
              Documentation
            </a>
          </DropdownMenuItem>
        )}
        {supportUrl && (
          <DropdownMenuItem asChild>
            <a href={supportUrl} target="_blank" rel="noreferrer">
              <LifeBuoy aria-hidden />
              Contact support
            </a>
          </DropdownMenuItem>
        )}
        {(docsUrl || supportUrl) && <DropdownMenuSeparator />}
        <DropdownMenuLabel className="flex items-center gap-2 text-meta font-normal text-muted-foreground">
          <Keyboard className="size-3.5" aria-hidden />
          Keyboard shortcuts
        </DropdownMenuLabel>
        <DropdownMenuItem disabled className="opacity-100! data-disabled:opacity-100">
          Search
          <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="opacity-100! data-disabled:opacity-100">
          Toggle sidebar
          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
