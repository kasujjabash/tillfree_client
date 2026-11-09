"use client";

import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/states";
import { StatusBadge } from "@/components/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useCurrentUser } from "@/features/authentication/auth-provider";
import { AuthPanel } from "@/features/authentication/components/auth-panel";
import type { MyMembership } from "@/types/api";
import { lastOrganisation, useMyMemberships } from "../api";
import { OrganisationAvatar } from "./organisation-avatar";

const INDUSTRY_LABEL = { business: "Business", healthcare: "Healthcare" } as const;

export function OrganisationPicker() {
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const memberships = useMyMemberships();
  const router = useRouter();
  const params = useSearchParams();
  const switching = params.get("switch") === "1";

  const active = memberships.data?.filter((m) => m.status === "active") ?? [];
  const pending = memberships.data?.filter((m) => m.status === "invited") ?? [];
  const last = typeof window !== "undefined" ? lastOrganisation() : null;

  // Return to the last organisation used, unless the user explicitly came here to switch.
  useEffect(() => {
    if (switching || !memberships.data) return;
    const remembered = memberships.data.find((m) => m.status === "active" && m.organisation.slug === lastOrganisation());
    if (remembered) router.replace(`/${remembered.organisation.slug}/overview`);
  }, [memberships.data, switching, router]);

  return (
    <AuthPanel
      title="Choose an organisation"
      description={
        <>
          Signed in as <span className="text-foreground">{user.email}</span>
        </>
      }
      footer={
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground">
          <LogOut aria-hidden />
          Sign out
        </Button>
      }
    >
      {memberships.isPending && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {memberships.isError && <ErrorState error={memberships.error} onRetry={() => memberships.refetch()} />}

      {memberships.data && (
        <>
          {active.length === 0 && pending.length === 0 && (
            <p className="text-body text-muted-foreground">
              You&apos;re not a member of any organisation yet. Ask an administrator to invite{" "}
              <span className="text-foreground">{user.email}</span>.
            </p>
          )}

          {active.length > 0 && (
            <ul className="-mx-2 flex flex-col" aria-label="Your organisations">
              {active.map((m) => (
                <li key={m.id}>
                  <OrganisationRow membership={m} isLast={m.organisation.slug === last} />
                </li>
              ))}
            </ul>
          )}

          {pending.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-overline text-muted-foreground">Pending invitations</p>
              <ul className="flex flex-col gap-2">
                {pending.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5">
                    <OrganisationAvatar id={m.organisation.id} name={m.organisation.name} size="lg" className="opacity-70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label">{m.organisation.name}</p>
                      <p className="text-meta text-muted-foreground">
                        Invited as {m.roles.map((r) => r.name).join(", ")}. Accept from your invitation email.
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </AuthPanel>
  );
}

function OrganisationRow({ membership: m, isLast }: { membership: MyMembership; isLast: boolean }) {
  return (
    <Link
      href={`/${m.organisation.slug}/overview`}
      className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent"
    >
      <OrganisationAvatar id={m.organisation.id} name={m.organisation.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-label">{m.organisation.name}</p>
          {isLast && <StatusBadge tone="neutral">Last used</StatusBadge>}
        </div>
        <p className="truncate text-meta text-muted-foreground">
          {m.organisation.industries.map((i) => INDUSTRY_LABEL[i]).join(" & ")} · {m.roles.map((r) => r.name).join(", ")}
        </p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
