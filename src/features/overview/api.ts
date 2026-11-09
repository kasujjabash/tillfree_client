import { useQuery } from "@tanstack/react-query";

import { useWorkspace } from "@/features/workspace/workspace-provider";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { BusinessOverview, HealthcareOverview } from "./types";

export function useBusinessOverview() {
  const { organisation, activeBranch } = useWorkspace();
  const branchId = activeBranch?.id ?? null;
  return useQuery({
    queryKey: queryKeys.org(organisation.id).overview("business", branchId),
    queryFn: ({ signal }) =>
      apiRequest<BusinessOverview>("/overview/business/", {
        organisationId: organisation.id,
        query: { branch: branchId },
        signal,
      }),
    refetchInterval: 60_000,
  });
}

export function useHealthcareOverview() {
  const { organisation, activeBranch } = useWorkspace();
  const branchId = activeBranch?.id ?? null;
  return useQuery({
    queryKey: queryKeys.org(organisation.id).overview("healthcare", branchId),
    queryFn: ({ signal }) =>
      apiRequest<HealthcareOverview>("/overview/healthcare/", {
        organisationId: organisation.id,
        query: { branch: branchId },
        signal,
      }),
    refetchInterval: 60_000,
  });
}
