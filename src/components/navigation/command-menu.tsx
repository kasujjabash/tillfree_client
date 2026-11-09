"use client";

import { ArrowRightLeft, CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { SECTION_LABELS } from "@/config/navigation";
import { useMyMemberships } from "@/features/organisations/api";
import { OrganisationAvatar } from "@/features/organisations/components/organisation-avatar";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { useVisibleNavigation } from "./use-visible-navigation";

/**
 * Global search (⌘K / Ctrl K). Today it covers destinations and organisations
 * the member can reach. Record search plugs in here once the API exposes a
 * tenant-scoped search endpoint; clinical records will need their own audited
 * search rather than appearing in this general list.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { href, organisation } = useWorkspace();
  const { all } = useVisibleNavigation();
  const { data: memberships } = useMyMemberships();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    router.push(to);
  };

  const otherOrgs = memberships?.filter((m) => m.status === "active" && m.organisation.id !== organisation.id) ?? [];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden h-7.5 w-56 justify-start gap-2 border-border bg-background px-2 font-normal text-muted-foreground shadow-none hover:bg-accent md:inline-flex lg:w-64"
      >
        <Search aria-hidden />
        <span className="flex-1 text-left">Search or jump to…</span>
        <Kbd className="h-5 px-1.5 font-sans text-[11px]">⌘K</Kbd>
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} className="md:hidden" aria-label="Search">
        <Search aria-hidden />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a page or organisation">
        <Command>
        <CommandInput placeholder="Search pages and organisations…" />
        <CommandList className="max-h-[min(420px,60vh)]">
          <CommandEmpty>No matches. Record search is coming with the API.</CommandEmpty>
          <CommandGroup heading="Go to">
            {all.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${SECTION_LABELS[item.section]} ${(item.keywords ?? []).join(" ")}`}
                  onSelect={() => go(href(item.path))}
                >
                  <Icon aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.section !== "workspace" && (
                    <span className="ml-auto text-meta text-muted-foreground">{SECTION_LABELS[item.section]}</span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
          {otherOrgs.length > 0 && (
            <CommandGroup heading="Switch organisation">
              {otherOrgs.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`switch ${m.organisation.name}`}
                  onSelect={() => go(`/${m.organisation.slug}/overview`)}
                >
                  <OrganisationAvatar id={m.organisation.id} name={m.organisation.name} size="sm" />
                  <span className="flex-1">{m.organisation.name}</span>
                  <ArrowRightLeft className="ml-auto text-muted-foreground" aria-hidden />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <div className="flex items-center gap-3 border-t px-3 py-2 text-meta text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="size-3" aria-hidden /> to open
          </span>
          <span>
            <Kbd className="h-4 px-1 text-[10px]">esc</Kbd> to close
          </span>
        </div>
        </Command>
      </CommandDialog>
    </>
  );
}
