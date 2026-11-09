import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useWorkspace } from "@/features/workspace/workspace-provider";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/query-keys";
import type { CursorPage } from "@/types/api";
import type { InviteMemberInput, Member, MemberListParams, OrganisationRole } from "./types";

export function useMembers(params: MemberListParams) {
  const { organisation } = useWorkspace();
  return useQuery({
    queryKey: queryKeys.org(organisation.id).members.list(params),
    queryFn: ({ signal }) =>
      apiRequest<CursorPage<Member>>("/memberships/", {
        organisationId: organisation.id,
        query: { ...params },
        signal,
      }),
    // Keep the current page on screen while the next one loads (no flash to skeleton).
    placeholderData: keepPreviousData,
  });
}

export function useRoles() {
  const { organisation } = useWorkspace();
  return useQuery({
    queryKey: queryKeys.org(organisation.id).roles(),
    queryFn: ({ signal }) =>
      apiRequest<CursorPage<OrganisationRole>>("/roles/", { organisationId: organisation.id, signal }),
    select: (page) => page.results,
    staleTime: 5 * 60_000,
  });
}

export function useInviteMember() {
  const { organisation } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: InviteMemberInput; idempotencyKey: string }) =>
      apiRequest<Member>("/invitations/", {
        method: "POST",
        organisationId: organisation.id,
        body: input,
        idempotencyKey,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.org(organisation.id).members.all }),
  });
}

export function useSetMemberStatus() {
  const { organisation } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ members, action }: { members: Member[]; action: "suspend" | "reactivate" }) => {
      const results = await Promise.allSettled(
        members.map((m) =>
          apiRequest<Member>(`/memberships/${encodeURIComponent(m.id)}/${action}/`, {
            method: "POST",
            organisationId: organisation.id,
          }),
        ),
      );
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      return { ok: results.length - failed.length, failed };
    },
    onSuccess: ({ ok, failed }, { action, members }) => {
      const verb = action === "suspend" ? "suspended" : "reactivated";
      if (ok > 0) {
        toast.success(
          members.length === 1 && ok === 1
            ? `${members[0].user.full_name}'s access ${verb}`
            : `${ok} ${ok === 1 ? "person" : "people"} ${verb}`,
        );
      }
      if (failed.length > 0) {
        toast.error(
          failed.length === 1 ? describeError(failed[0].reason) : `${failed.length} changes failed. ${describeError(failed[0].reason)}`,
        );
      }
    },
    onError: (error) => toast.error(describeError(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.org(organisation.id).members.all }),
  });
}
