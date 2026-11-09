/**
 * Wire types shared across features. They mirror the Django API contract
 * (docs/architecture/08-api.md in the server repo): snake_case fields, UUIDs as
 * strings, ISO 8601 UTC timestamps, money as { amount: string, currency }.
 */

export type UUID = string;
/** ISO 8601 timestamp in UTC, e.g. "2026-11-09T07:30:00Z". */
export type Timestamp = string;
/** Calendar date, "YYYY-MM-DD". */
export type CalendarDate = string;

/** Money is never a JS number on the wire: the amount is a decimal string. */
export interface Money {
  amount: string;
  currency: string; // ISO 4217
}

/** Cursor-paginated collection (default page size 25, max 100). */
export interface CursorPage<T> {
  results: T[];
  next: string | null;
  previous: string | null;
}

export type Industry = "business" | "healthcare";

export type Sensitivity = "standard" | "sensitive" | "clinical";

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  phone_e164: string | null;
  locale: string;
  timezone: string | null;
  email_verified_at: Timestamp | null;
}

export interface OrganisationSummary {
  id: UUID;
  name: string;
  slug: string;
  country_code: string;
  industries: Industry[];
  status: "active" | "suspended" | "closed";
}

export interface RoleSummary {
  id: UUID;
  key: string;
  name: string;
}

/** GET /api/v1/me/memberships/ — the user's organisations; no tenant header. */
export interface MyMembership {
  id: UUID;
  status: "invited" | "active" | "suspended" | "left";
  organisation: OrganisationSummary;
  roles: RoleSummary[];
}

export interface Organisation extends OrganisationSummary {
  legal_name: string;
  base_currency: string;
  default_timezone: string; // IANA
  default_locale: string; // BCP 47
}

export interface Branch {
  id: UUID;
  code: string;
  name: string;
  country_code: string;
  timezone: string;
  is_active: boolean;
}

/**
 * GET /api/v1/me/access/ with X-Organisation-ID.
 * PROPOSED CONTRACT — not yet in the server docs. The client needs the effective
 * permission set, entitled modules and permitted branches to shape navigation.
 * These are UX hints only; Django enforces every request independently.
 */
export interface WorkspaceAccess {
  organisation: Organisation;
  membership_id: UUID;
  roles: RoleSummary[];
  permissions: string[];
  modules: string[];
  branches: Branch[];
  /** True when at least one role assignment is not branch-scoped. */
  all_branches: boolean;
}
