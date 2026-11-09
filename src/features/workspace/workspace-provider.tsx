"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { FullPageLoader } from "@/components/feedback/full-page-loader";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/authentication/auth-provider";
import { rememberOrganisation, useMyMemberships, useWorkspaceAccess } from "@/features/organisations/api";
import { isOrgQueryKey } from "@/lib/api/query-keys";
import type { FormatContext } from "@/lib/formatting";
import type { Branch, Organisation, RoleSummary } from "@/types/api";

/**
 * The active workspace: which organisation, what this member may see, which
 * branch is in focus and how to format values. Server state lives in TanStack
 * Query; this context only derives from it and holds the branch selection.
 *
 * The organisation comes from the URL (/[organisationSlug]/…), never from a
 * global default, so two tabs can work in two organisations at once.
 */
interface WorkspaceContextValue {
  organisation: Organisation;
  roles: RoleSummary[];
  permissions: ReadonlySet<string>;
  modules: ReadonlySet<string>;
  /** Branches this member may act in. */
  branches: Branch[];
  /** Whether "All branches" is a valid choice for this member. */
  allBranches: boolean;
  /** null = all branches. */
  activeBranch: Branch | null;
  setActiveBranchId: (id: string | null) => void;
  format: FormatContext;
  can: (permission: string) => boolean;
  hasModule: (module: string) => boolean;
  href: (path: string) => string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const branchStorageKey = (orgId: string) => `uos.branch.${orgId}`;

export function WorkspaceProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const memberships = useMyMemberships();
  const membership = memberships.data?.find((m) => m.organisation.slug === slug && m.status === "active");
  const orgId = membership?.organisation.id;
  const access = useWorkspaceAccess(orgId);

  // Tenant isolation in the cache: drop every other organisation's data on entry.
  useEffect(() => {
    if (!orgId) return;
    queryClient.removeQueries({
      predicate: (q) => isOrgQueryKey(q.queryKey) && q.queryKey[1] !== orgId,
    });
    rememberOrganisation(slug);
  }, [orgId, slug, queryClient]);

  const [branchChoice, setBranchChoice] = useState<{ orgId: string; id: string | null } | null>(null);

  const setActiveBranchId = useCallback(
    (id: string | null) => {
      if (!orgId) return;
      setBranchChoice({ orgId, id });
      try {
        if (id) localStorage.setItem(branchStorageKey(orgId), id);
        else localStorage.removeItem(branchStorageKey(orgId));
      } catch {
        /* ignore */
      }
    },
    [orgId],
  );

  const value = useMemo<WorkspaceContextValue | null>(() => {
    const data = access.data;
    if (!data) return null;
    const permissions = new Set(data.permissions);
    const modules = new Set(data.modules);

    // Branch: explicit choice > remembered choice > all (if allowed) > first permitted branch.
    let chosen: string | null | undefined =
      branchChoice?.orgId === data.organisation.id ? branchChoice.id : undefined;
    if (chosen === undefined) {
      try {
        chosen = localStorage.getItem(branchStorageKey(data.organisation.id));
      } catch {
        chosen = null;
      }
    }
    let activeBranch = data.branches.find((b) => b.id === chosen) ?? null;
    if (!activeBranch && !data.all_branches) activeBranch = data.branches[0] ?? null;

    const timeZone = activeBranch?.timezone ?? user.timezone ?? data.organisation.default_timezone;

    return {
      organisation: data.organisation,
      roles: data.roles,
      permissions,
      modules,
      branches: data.branches,
      allBranches: data.all_branches,
      activeBranch,
      setActiveBranchId,
      format: { locale: data.organisation.default_locale, timeZone },
      can: (p) => permissions.has(p),
      hasModule: (m) => modules.has(m),
      href: (path) => `/${data.organisation.slug}/${path.replace(/^\//, "")}`,
    };
  }, [access.data, branchChoice, setActiveBranchId, user.timezone]);

  if (memberships.isPending || (orgId && access.isPending)) {
    return <FullPageLoader label="Loading workspace" />;
  }
  if (memberships.isError) {
    return <ErrorState size="page" error={memberships.error} onRetry={() => memberships.refetch()} />;
  }
  if (!membership) {
    return (
      <EmptyState
        size="page"
        icon={Building2}
        title="Organisation not available"
        description="It doesn't exist, or you're not an active member of it. If you were recently removed or your invitation is still pending, ask an administrator."
        action={
          <Button asChild variant="outline">
            <Link href="/select-organisation?switch=1">Choose an organisation</Link>
          </Button>
        }
      />
    );
  }
  if (access.isError || !value) {
    return <ErrorState size="page" error={access.error} onRetry={() => access.refetch()} />;
  }

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>;
}

export function useWorkspace() {
  const ctx = use(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

/** Renders children only when the member holds the permission. A UX affordance, not security. */
export function Can({ permission, children, fallback = null }: { permission: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { can } = useWorkspace();
  return <>{can(permission) ? children : fallback}</>;
}
