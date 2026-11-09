/**
 * Query keys are the cache's tenancy boundary.
 *
 *   ["me", ...]                 user-scoped, survives organisation switches
 *   ["org", orgId, domain, ...] tenant-scoped, always prefixed with the org id
 *
 * On an organisation switch, every ["org", otherId, ...] entry is removed (see
 * features/workspace/workspace-provider.tsx), so data from one organisation can
 * never render inside another's workspace, even for a frame.
 */
export const queryKeys = {
  me: {
    all: ["me"] as const,
    profile: () => ["me", "profile"] as const,
    memberships: () => ["me", "memberships"] as const,
  },
  org: (orgId: string) => {
    const root = ["org", orgId] as const;
    return {
      all: root,
      access: () => [...root, "access"] as const,
      overview: (industry: string, branchId: string | null) =>
        [...root, "overview", industry, branchId ?? "all"] as const,
      roles: () => [...root, "roles"] as const,
      members: {
        all: [...root, "members"] as const,
        list: (params: object) => [...root, "members", "list", params] as const,
      },
      notifications: {
        all: [...root, "notifications"] as const,
      },
    };
  },
};

export function isOrgQueryKey(key: readonly unknown[]): key is readonly ["org", string, ...unknown[]] {
  return key[0] === "org" && typeof key[1] === "string";
}
