/**
 * In-browser stand-in for the Django API, used only in mock mode.
 *
 * It implements the same contract the real backend documents: bearer auth,
 * X-Organisation-ID tenant resolution (404 for non-members), cursor pagination
 * and RFC 9457 problem+json errors. That way the client's real error, refresh
 * and tenancy code paths are exercised during design review.
 */
import type { InviteMemberInput, Member, MemberStatus } from "@/features/memberships/types";
import type { CursorPage } from "@/types/api";
import {
  accessByOrganisation,
  businessOverview,
  DEMO_CREDENTIALS,
  demoUser,
  healthcareOverview,
  membersByOrganisation,
  myMemberships,
  notificationsFor,
  rolesByOrganisation,
} from "./data";

// Simulates the HttpOnly refresh cookie surviving a reload. Holds only a flag, never data.
const SESSION_FLAG = "uos.mock.refresh";

function hasSession() {
  try {
    return sessionStorage.getItem(SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

function setSession(on: boolean) {
  try {
    if (on) sessionStorage.setItem(SESSION_FLAG, "1");
    else sessionStorage.removeItem(SESSION_FLAG);
  } catch {
    /* storage unavailable: session lasts for this page only */
  }
}

function json(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function problem(status: number, code: string, title: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ status, code, title, request_id: crypto.randomUUID(), ...extra }), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

function delay(signal?: AbortSignal | null) {
  const ms = 220 + Math.random() * 260;
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

function paginate<T>(items: T[], cursor: string | null, pageSize: number): CursorPage<T> {
  const offset = cursor ? Number(atob(cursor)) || 0 : 0;
  const results = items.slice(offset, offset + pageSize);
  const next = offset + pageSize < items.length ? btoa(String(offset + pageSize)) : null;
  const previous = offset > 0 ? btoa(String(Math.max(0, offset - pageSize))) : null;
  return { results, next, previous };
}

function memberMatches(m: Member, search: string, statuses: string[], roles: string[]) {
  if (statuses.length && !statuses.includes(m.status)) return false;
  if (roles.length && !m.role_assignments.some((a) => roles.includes(a.role.key))) return false;
  if (!search) return true;
  const q = search.toLowerCase();
  return m.user.full_name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q);
}

function sortMembers(items: Member[], ordering: string | null) {
  if (!ordering) return items;
  const desc = ordering.startsWith("-");
  const field = ordering.replace(/^-/, "");
  const value = (m: Member): string => {
    switch (field) {
      case "name":
        return m.user.full_name;
      case "role":
        return m.role_assignments[0]?.role.name ?? "";
      case "status":
        return m.status;
      case "joined_at":
        return m.joined_at ?? "";
      case "last_active_at":
        return m.last_active_at ?? "";
      default:
        return "";
    }
  };
  return [...items].sort((a, b) => value(a).localeCompare(value(b)) * (desc ? -1 : 1));
}

export async function mockFetch(input: string, init: RequestInit): Promise<Response> {
  await delay(init.signal);

  const url = new URL(input, "http://mock.local");
  const path = url.pathname.replace(/^\/api\/v1/, "");
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  const q = url.searchParams;

  // ── Authentication (public) ──
  if (path === "/auth/login/" && method === "POST") {
    if (body?.email?.toLowerCase() === DEMO_CREDENTIALS.email && body?.password === DEMO_CREDENTIALS.password) {
      setSession(true);
      return json({ access: `mock.${crypto.randomUUID()}` });
    }
    return problem(400, "invalid_credentials", "Invalid email or password.", {
      detail: "Invalid email or password.",
    });
  }
  if (path === "/auth/refresh/" && method === "POST") {
    return hasSession() ? json({ access: `mock.${crypto.randomUUID()}` }) : problem(401, "not_authenticated", "Not signed in.");
  }
  if (path === "/auth/logout/" && method === "POST") {
    setSession(false);
    return json(null, 204);
  }
  if (path === "/auth/password/reset/" && method === "POST") {
    // Identical response whether or not the account exists.
    return json({}, 202);
  }

  // ── Everything else requires a bearer token ──
  const auth = headers.get("Authorization");
  if (!auth?.startsWith("Bearer mock.") || !hasSession()) {
    return problem(401, "token_expired", "Authentication required.");
  }

  if (path === "/me/" && method === "GET") return json(demoUser);
  if (path === "/me/memberships/" && method === "GET") {
    return json({ results: myMemberships, next: null, previous: null });
  }

  // ── Tenant endpoints: resolve the organisation, 404 if not an active member ──
  const orgId = headers.get("X-Organisation-ID");
  const access = orgId ? accessByOrganisation[orgId] : undefined;
  if (!orgId || !access) return problem(404, "not_found", "Not found.");
  const can = (permission: string) => access.permissions.includes(permission);
  const forbidden = () => problem(403, "permission_denied", "You do not have permission to perform this action.");

  if (path === "/me/access/" && method === "GET") return json(access);

  if (path === "/roles/" && method === "GET") {
    if (!can("organisations.membership.view")) return forbidden();
    return json({ results: rolesByOrganisation[orgId] ?? [], next: null, previous: null });
  }

  if (path === "/memberships/" && method === "GET") {
    if (!can("organisations.membership.view")) return forbidden();
    const all = membersByOrganisation[orgId] ?? [];
    const filtered = sortMembers(
      all.filter((m) => memberMatches(m, q.get("search") ?? "", q.getAll("status"), q.getAll("role"))),
      q.get("ordering"),
    );
    const pageSize = Math.min(Number(q.get("page_size")) || 25, 100);
    return json(paginate(filtered, q.get("cursor"), pageSize));
  }

  const statusChange = path.match(/^\/memberships\/([^/]+)\/(suspend|reactivate)\/$/);
  if (statusChange && method === "POST") {
    if (!can("organisations.membership.update")) return forbidden();
    const member = membersByOrganisation[orgId]?.find((m) => m.id === statusChange[1]);
    if (!member) return problem(404, "not_found", "Not found.");
    if (member.user.email === demoUser.email) {
      return problem(400, "business_rule_violation", "You can't suspend yourself.", {
        detail: "You can't suspend your own membership.",
      });
    }
    member.status = (statusChange[2] === "suspend" ? "suspended" : "active") as MemberStatus;
    return json(member);
  }

  if (path === "/invitations/" && method === "POST") {
    if (!can("organisations.membership.invite")) return forbidden();
    const input = body as InviteMemberInput;
    const members = membersByOrganisation[orgId];
    if (members.some((m) => m.user.email.toLowerCase() === input.email.toLowerCase())) {
      return problem(400, "validation_error", "Invalid input.", {
        detail: "One or more fields are invalid.",
        errors: [{ field: "email", code: "already_member", message: "This person is already a member or has a pending invitation." }],
      });
    }
    const r = rolesByOrganisation[orgId].find((x) => x.id === input.role_id);
    const b = access.branches.find((x) => x.id === input.branch_id) ?? null;
    if (!r) {
      return problem(400, "validation_error", "Invalid input.", {
        errors: [{ field: "role_id", code: "does_not_exist", message: "Role not found." }],
      });
    }
    const member: Member = {
      id: `inv-${crypto.randomUUID().slice(0, 8)}`,
      user: { id: crypto.randomUUID(), full_name: input.full_name, email: input.email, phone_e164: null },
      status: "invited",
      role_assignments: [{ id: crypto.randomUUID(), role: { id: r.id, key: r.key, name: r.name }, branch: b ? { id: b.id, name: b.name } : null }],
      department: null,
      joined_at: null,
      last_active_at: null,
    };
    members.unshift(member);
    return json(member, 201);
  }

  if (path === "/overview/business/" && method === "GET") {
    if (!access.organisation.industries.includes("business")) return problem(403, "module_not_enabled", "Module not enabled.");
    return json(businessOverview(q.get("branch")));
  }
  if (path === "/overview/healthcare/" && method === "GET") {
    if (!access.organisation.industries.includes("healthcare")) return problem(403, "module_not_enabled", "Module not enabled.");
    return json(healthcareOverview(can("healthcare.patient.read")));
  }

  if (path === "/notifications/" && method === "GET") {
    return json({ results: notificationsFor(orgId), next: null, previous: null });
  }

  return problem(404, "not_found", "Not found.");
}
