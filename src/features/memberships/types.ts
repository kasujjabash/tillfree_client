import type { Timestamp, UUID } from "@/types/api";

export type MemberStatus = "invited" | "active" | "suspended";

export interface MemberRoleAssignment {
  id: UUID;
  role: { id: UUID; key: string; name: string };
  /** null = all branches */
  branch: { id: UUID; name: string } | null;
}

export interface Member {
  id: UUID;
  user: { id: UUID; full_name: string; email: string; phone_e164: string | null };
  status: MemberStatus;
  role_assignments: MemberRoleAssignment[];
  department: string | null;
  joined_at: Timestamp | null;
  last_active_at: Timestamp | null;
}

export interface MemberListParams {
  search?: string;
  status?: MemberStatus[];
  role?: string[];
  ordering?: string;
  cursor?: string | null;
  page_size?: number;
}

export interface InviteMemberInput {
  email: string;
  full_name: string;
  role_id: UUID;
  /** null = all branches */
  branch_id: UUID | null;
  message?: string;
}

export interface OrganisationRole {
  id: UUID;
  key: string;
  name: string;
  description: string;
  sensitivity: "standard" | "sensitive" | "clinical";
}
