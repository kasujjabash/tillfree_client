import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { CursorPage, MyMembership, WorkspaceAccess } from "@/types/api";

export function getMyMemberships(signal?: AbortSignal) {
  return apiRequest<CursorPage<MyMembership>>("/me/memberships/", { signal });
}

export function getWorkspaceAccess(organisationId: string, signal?: AbortSignal) {
  return apiRequest<WorkspaceAccess>("/me/access/", { organisationId, signal });
}

export function useMyMemberships() {
  return useQuery({
    queryKey: queryKeys.me.memberships(),
    queryFn: ({ signal }) => getMyMemberships(signal),
    select: (page) => page.results,
    staleTime: 60_000,
  });
}

export function useWorkspaceAccess(organisationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.org(organisationId ?? "none").access(),
    queryFn: ({ signal }) => getWorkspaceAccess(organisationId!, signal),
    enabled: Boolean(organisationId),
    staleTime: 60_000,
  });
}

/** Remembered only to skip the picker next time. Holds a slug, never tenant data. */
const LAST_ORG_KEY = "uos.lastOrganisation";

export function rememberOrganisation(slug: string) {
  try {
    localStorage.setItem(LAST_ORG_KEY, slug);
  } catch {
    /* ignore */
  }
}

export function lastOrganisation(): string | null {
  try {
    return localStorage.getItem(LAST_ORG_KEY);
  } catch {
    return null;
  }
}

export function forgetOrganisation() {
  try {
    localStorage.removeItem(LAST_ORG_KEY);
  } catch {
    /* ignore */
  }
}
