/**
 * SAMPLE DATA — for local development and design review only.
 *
 * Every organisation, person and figure in this file is fictional. This module
 * is loaded only when NEXT_PUBLIC_API_MODE=mock (via a dynamic import in
 * lib/api/client.ts) and the app shows a "Sample data" label while it is in use.
 */
import type { Member, OrganisationRole } from "@/features/memberships/types";
import type { AppNotification } from "@/features/notifications/types";
import type { BusinessOverview, HealthcareOverview } from "@/features/overview/types";
import type { Branch, MyMembership, Organisation, User, WorkspaceAccess } from "@/types/api";

export const DEMO_CREDENTIALS = { email: "amina@example.com", password: "demo-password" };

export const demoUser: User = {
  id: "0193a000-0000-7000-8000-000000000001",
  email: DEMO_CREDENTIALS.email,
  full_name: "Amina Nakato",
  phone_e164: "+256700000001",
  locale: "en-GB",
  timezone: null,
  email_verified_at: "2026-01-12T09:00:00Z",
};

// ─── Organisations ──────────────────────────────────────────────────────────

const nile: Organisation = {
  id: "0193a000-0000-7000-8000-0000000000a1",
  name: "Nile Valley Traders",
  legal_name: "Nile Valley Traders Ltd",
  slug: "nile-valley-traders",
  country_code: "UG",
  base_currency: "UGX",
  default_timezone: "Africa/Kampala",
  default_locale: "en-UG",
  industries: ["business"],
  status: "active",
};

const kijani: Organisation = {
  id: "0193a000-0000-7000-8000-0000000000b1",
  name: "Kijani Home Health",
  legal_name: "Kijani Home Health Services Ltd",
  slug: "kijani-home-health",
  country_code: "KE",
  base_currency: "KES",
  default_timezone: "Africa/Nairobi",
  default_locale: "en-KE",
  industries: ["healthcare"],
  status: "active",
};

const lakeview: Organisation = {
  id: "0193a000-0000-7000-8000-0000000000c1",
  name: "Lakeview Pharmacy",
  legal_name: "Lakeview Pharmacy Ltd",
  slug: "lakeview-pharmacy",
  country_code: "TZ",
  base_currency: "TZS",
  default_timezone: "Africa/Dar_es_Salaam",
  default_locale: "en-TZ",
  industries: ["business"],
  status: "active",
};

const nileBranches: Branch[] = [
  { id: "0193a000-0000-7000-8000-0000000001a1", code: "KLA", name: "Kampala Central", country_code: "UG", timezone: "Africa/Kampala", is_active: true },
  { id: "0193a000-0000-7000-8000-0000000001a2", code: "JJR", name: "Jinja Road", country_code: "UG", timezone: "Africa/Kampala", is_active: true },
  { id: "0193a000-0000-7000-8000-0000000001a3", code: "EBB", name: "Entebbe", country_code: "UG", timezone: "Africa/Kampala", is_active: true },
];

const kijaniBranches: Branch[] = [
  { id: "0193a000-0000-7000-8000-0000000001b1", code: "WL", name: "Westlands", country_code: "KE", timezone: "Africa/Nairobi", is_active: true },
  { id: "0193a000-0000-7000-8000-0000000001b2", code: "KL", name: "Kilimani", country_code: "KE", timezone: "Africa/Nairobi", is_active: true },
];

const role = (id: string, key: string, name: string) => ({ id, key, name });

export const myMemberships: MyMembership[] = [
  { id: "m-nile", status: "active", organisation: summary(nile), roles: [role("r-owner", "owner", "Owner")] },
  { id: "m-kijani", status: "active", organisation: summary(kijani), roles: [role("r-coord", "care_coordinator", "Care coordinator")] },
  { id: "m-lakeview", status: "invited", organisation: summary(lakeview), roles: [role("r-mgr", "manager", "Manager")] },
];

function summary(o: Organisation) {
  const { id, name, slug, country_code, industries, status } = o;
  return { id, name, slug, country_code, industries, status };
}

const PLATFORM_PERMISSIONS = [
  "organisations.membership.view",
  "organisations.membership.invite",
  "organisations.membership.update",
  "organisations.branch.view",
  "organisations.role.view",
  "organisations.settings.view",
  "subscriptions.entitlement.view",
  "subscriptions.subscription.view",
  "integrations.connection.view",
  "audit.event.view",
  "documents.file.view",
  "reports.report.view",
];

export const accessByOrganisation: Record<string, WorkspaceAccess> = {
  [nile.id]: {
    organisation: nile,
    membership_id: "m-nile",
    roles: [role("r-owner", "owner", "Owner")],
    modules: [
      "platform.reports",
      "platform.documents",
      "platform.integrations",
      "business.customers",
      "business.sales",
      "business.invoicing",
      "business.catalogue",
      "business.inventory",
      "business.procurement",
      "business.expenses",
      "business.finance",
    ],
    permissions: [
      ...PLATFORM_PERMISSIONS,
      "business.customer.view",
      "business.sale.view",
      "business.invoice.view",
      "business.product.view",
      "inventory.stock.view",
      "procurement.supplier.view",
      "procurement.order.view",
      "business.expense.view",
      "finance.ledger.view",
    ],
    branches: nileBranches,
    all_branches: true,
  },
  [kijani.id]: {
    organisation: kijani,
    membership_id: "m-kijani",
    roles: [role("r-coord", "care_coordinator", "Care coordinator")],
    // No pharmacy, billing or clinical-encounter modules on this plan.
    modules: [
      "platform.documents",
      "healthcare.patients",
      "healthcare.scheduling",
      "healthcare.home_care",
      "healthcare.bedside_care",
      "healthcare.laboratory",
      "healthcare.delivery",
      "healthcare.workforce",
    ],
    // A coordinator: can see people but not invite; no settings, audit or subscription access.
    permissions: [
      "organisations.membership.view",
      "organisations.branch.view",
      "documents.file.view",
      "healthcare.patient.read",
      "healthcare.appointment.view",
      "healthcare.visit.view",
      "healthcare.assignment.view",
      "healthcare.lab_request.view",
      "healthcare.delivery.view",
      "healthcare.professional.view",
      "healthcare.rota.view",
    ],
    branches: [kijaniBranches[0]],
    all_branches: false,
  },
};

// ─── Roles ──────────────────────────────────────────────────────────────────

export const rolesByOrganisation: Record<string, OrganisationRole[]> = {
  [nile.id]: [
    { id: "r-owner", key: "owner", name: "Owner", description: "Full access, including billing and ownership transfer.", sensitivity: "sensitive" },
    { id: "r-admin", key: "administrator", name: "Administrator", description: "Manages people, branches and settings.", sensitivity: "sensitive" },
    { id: "r-mgr", key: "manager", name: "Branch manager", description: "Runs a branch: sales, stock and staff.", sensitivity: "sensitive" },
    { id: "r-cashier", key: "cashier", name: "Cashier", description: "Records sales and refunds requests.", sensitivity: "standard" },
    { id: "r-stock", key: "stock_keeper", name: "Stock keeper", description: "Receives deliveries and counts stock.", sensitivity: "standard" },
    { id: "r-acct", key: "accountant", name: "Accountant", description: "Invoices, expenses and financial reports.", sensitivity: "sensitive" },
  ],
  [kijani.id]: [
    { id: "r-admin-k", key: "administrator", name: "Administrator", description: "Manages people, branches and settings. No clinical access.", sensitivity: "sensitive" },
    { id: "r-coord", key: "care_coordinator", name: "Care coordinator", description: "Schedules visits and assigns care teams.", sensitivity: "clinical" },
    { id: "r-nurse", key: "nurse", name: "Nurse", description: "Records visits and observations for assigned patients.", sensitivity: "clinical" },
    { id: "r-clin", key: "clinician", name: "Clinician", description: "Clinical notes, prescriptions and lab requests.", sensitivity: "clinical" },
    { id: "r-rider", key: "delivery_rider", name: "Delivery rider", description: "Sees delivery addresses for assigned runs only.", sensitivity: "standard" },
  ],
};

// ─── Members ────────────────────────────────────────────────────────────────

const FIRST = ["Grace", "Joseph", "Sarah", "Brian", "Ruth", "Daniel", "Esther", "Moses", "Faith", "Isaac", "Joan", "Peter", "Mercy", "Samuel", "Rebecca", "David", "Agnes", "Ivan", "Lillian", "Patrick", "Doreen", "Allan", "Winnie", "Henry", "Brenda", "Kevin", "Christine", "Emmanuel", "Juliet", "Ronald"];
const LAST = ["Achieng", "Mugisha", "Wanjiru", "Okello", "Namubiru", "Kiprono", "Atim", "Ssempijja", "Njeri", "Tumusiime", "Auma", "Kariuki", "Nabirye", "Otieno", "Kemunto", "Byaruhanga", "Akinyi", "Mutua", "Nansubuga", "Odhiambo"];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildMembers(orgId: string, count: number, seed: number, domain: string): Member[] {
  const rand = seeded(seed);
  const roles = rolesByOrganisation[orgId];
  const branches = orgId === nile.id ? nileBranches : kijaniBranches;
  const departments = orgId === nile.id ? ["Sales", "Stores", "Finance", "Operations"] : ["Home care", "Clinical", "Logistics", "Administration"];
  const now = Date.now();
  const members: Member[] = [];
  for (let i = 0; i < count; i++) {
    // Step through name combinations so no two members share a name.
    const first = FIRST[(i * 7 + seed) % FIRST.length];
    const last = LAST[(i * 3 + seed * 5) % LAST.length];
    rand();
    rand();
    const r = roles[i === 0 ? 0 : 1 + Math.floor(rand() * (roles.length - 1))];
    const statusRoll = rand();
    const status = i < 3 ? "active" : statusRoll < 0.1 ? "invited" : statusRoll < 0.16 ? "suspended" : "active";
    const branchScoped = r.key !== "owner" && r.key !== "administrator" && rand() < 0.75;
    const branch = branchScoped ? branches[Math.floor(rand() * branches.length)] : null;
    const joinedDaysAgo = Math.floor(rand() * 700) + 5;
    const lastActiveMinutes = Math.floor(rand() ** 3 * 60 * 24 * 20);
    members.push({
      id: `${orgId.slice(-2)}-mem-${String(i + 1).padStart(3, "0")}`,
      user: {
        id: `${orgId.slice(-2)}-usr-${i + 1}`,
        full_name: i === 0 ? demoUser.full_name : `${first} ${last}`,
        email: i === 0 ? demoUser.email : `${first}.${last}${i}@${domain}`.toLowerCase(),
        phone_e164: rand() < 0.8 ? `${orgId === nile.id ? "+2567" : "+2547"}${String(Math.floor(rand() * 1e8)).padStart(8, "0")}` : null,
      },
      status,
      role_assignments: [
        { id: `ra-${orgId.slice(-2)}-${i}`, role: { id: r.id, key: r.key, name: r.name }, branch: branch ? { id: branch.id, name: branch.name } : null },
      ],
      department: r.key === "owner" ? null : departments[Math.floor(rand() * departments.length)],
      joined_at: status === "invited" ? null : new Date(now - joinedDaysAgo * 864e5).toISOString(),
      last_active_at: status === "active" ? new Date(now - lastActiveMinutes * 6e4).toISOString() : null,
    });
  }
  return members;
}

export const membersByOrganisation: Record<string, Member[]> = {
  [nile.id]: buildMembers(nile.id, 46, 7, "nilevalley.example"),
  [kijani.id]: buildMembers(kijani.id, 23, 11, "kijanihealth.example"),
};

// ─── Overview ───────────────────────────────────────────────────────────────

function todayAt(hours: number, minutes: number, utcOffsetHours: number) {
  const d = new Date();
  d.setUTCHours(hours - utcOffsetHours, minutes, 0, 0);
  return d.toISOString();
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 36e5).toISOString();
}

export function businessOverview(branchId: string | null): BusinessOverview {
  const scale = branchId ? 0.38 : 1;
  const ugx = (n: number) => ({ amount: String(Math.round((n * scale) / 100) * 100), currency: "UGX" });
  const branchName = (i: number) => (branchId ? nileBranches.find((b) => b.id === branchId)!.name : nileBranches[i % 3].name);
  const methods = ["mobile_money", "cash", "mobile_money", "card", "cash", "bank_transfer", "mobile_money", "cash"] as const;
  const totals = [182000, 46500, 1250000, 89000, 23500, 612000, 154000, 38000];
  return {
    as_of: new Date().toISOString(),
    business_date: new Date().toISOString().slice(0, 10),
    sales_today: { total: ugx(4826500), count: Math.round(37 * scale), same_day_last_week: ugx(4410000) },
    receivables: { outstanding: ugx(18740000), open_count: Math.round(12 * scale) || 1, overdue: ugx(5320000), overdue_count: Math.round(3 * scale) || 1 },
    stock: { low_stock_count: Math.round(8 * scale) || 1, out_of_stock_count: Math.round(2 * scale), expiring_30d_count: Math.round(5 * scale) || 1 },
    attention: [
      { id: "a1", kind: "overdue_invoice", title: "Invoice INV-2026-0418 is 21 days overdue", detail: "Mbarara Wholesale Stores · UGX 2,140,000", severity: "high", due_at: null, target: "invoicing" },
      { id: "a2", kind: "out_of_stock", title: "2 products are out of stock", detail: `Maize flour 10 kg, Cooking oil 3 L${branchId ? "" : " · Jinja Road"}`, severity: "high", due_at: null, target: "inventory" },
      { id: "a3", kind: "purchase_order", title: "Purchase order PO-0192 awaiting approval", detail: "Raised by Brian Okello · UGX 7,800,000", severity: "medium", due_at: hoursFromNow(20), target: "procurement" },
      { id: "a4", kind: "expiring_stock", title: "5 batches expire within 30 days", detail: "Earliest: Infant formula 400 g, batch 24-117", severity: "medium", due_at: null, target: "inventory" },
      { id: "a5", kind: "expense", title: "3 expense claims to review", detail: "Fuel and delivery costs, submitted this week", severity: "low", due_at: null, target: "expenses" },
    ],
    recent_sales: totals.map((t, i) => ({
      id: `s${i}`,
      reference: `RCT-${String(20931 - i).padStart(6, "0")}`,
      branch_name: branchName(i),
      occurred_at: new Date(Date.now() - (i * 23 + 4) * 6e4).toISOString(),
      payment_method: methods[i],
      items_count: (i % 5) + 1,
      total: { amount: String(t), currency: "UGX" },
      status: i === 5 ? "refunded" : "completed",
    })),
  };
}

export function healthcareOverview(canReadPatients: boolean): HealthcareOverview {
  const patient = (name: string) => (canReadPatients ? { display_name: name } : null);
  const rows: HealthcareOverview["appointments_today"] = [
    { id: "ap1", starts_at: todayAt(8, 0, 3), patient: patient("Wairimu K."), service: "Wound care review", setting: "home", professional_name: "Nurse Achieng Otieno", status: "completed" },
    { id: "ap2", starts_at: todayAt(9, 30, 3), patient: patient("Otieno M."), service: "Post-discharge check", setting: "home", professional_name: "Nurse Achieng Otieno", status: "completed" },
    { id: "ap3", starts_at: todayAt(10, 0, 3), patient: patient("Njoroge P."), service: "Physiotherapy session", setting: "facility", professional_name: "Kevin Mutua", status: "in_progress" },
    { id: "ap4", starts_at: todayAt(11, 15, 3), patient: patient("Chebet A."), service: "Diabetes follow-up", setting: "virtual", professional_name: "Dr. Faith Kariuki", status: "checked_in" },
    { id: "ap5", starts_at: todayAt(13, 0, 3), patient: patient("Kamau J."), service: "Palliative care visit", setting: "home", professional_name: "Nurse Ruth Wanjiru", status: "scheduled" },
    { id: "ap6", starts_at: todayAt(14, 30, 3), patient: patient("Akinyi L."), service: "Antenatal home visit", setting: "home", professional_name: "Midwife Esther Kemunto", status: "scheduled" },
    { id: "ap7", starts_at: todayAt(15, 0, 3), patient: patient("Mwangi D."), service: "Medication review", setting: "facility", professional_name: "Dr. Faith Kariuki", status: "cancelled" },
    { id: "ap8", starts_at: todayAt(16, 30, 3), patient: patient("Wanjiku S."), service: "Catheter change", setting: "home", professional_name: "Nurse Ruth Wanjiru", status: "scheduled" },
  ];
  return {
    as_of: new Date().toISOString(),
    business_date: new Date().toISOString().slice(0, 10),
    appointments_today: rows,
    counts: {
      home_visits_next_7d: 46,
      bedside_assignments_active: 7,
      professionals_on_duty: 11,
      professionals_rostered_today: 13,
      lab_requests_pending: 9,
      lab_requests_overdue: 2,
      deliveries_in_transit: 4,
      deliveries_due_today: 6,
    },
    tasks: [
      { id: "t1", kind: "lab_overdue", title: "2 lab results are past their expected time", detail: "Requested by Dr. Faith Kariuki", severity: "high", due_at: null, target: "laboratory" },
      { id: "t2", kind: "rota_gap", title: "Night shift on Thursday has no nurse assigned", detail: "Bedside care · Westlands", severity: "high", due_at: hoursFromNow(52), target: "staff-scheduling" },
      { id: "t3", kind: "visit_unassigned", title: "3 home visits tomorrow are unassigned", detail: "Westlands area", severity: "medium", due_at: hoursFromNow(18), target: "home-care" },
      { id: "t4", kind: "delivery_failed", title: "1 medicine delivery could not be completed", detail: "Recipient unavailable · rescheduling needed", severity: "medium", due_at: null, target: "medicine-delivery" },
    ],
  };
}

// ─── Notifications ──────────────────────────────────────────────────────────

export function notificationsFor(orgId: string): AppNotification[] {
  const ago = (m: number) => new Date(Date.now() - m * 6e4).toISOString();
  if (orgId === kijani.id) {
    return [
      { id: "n1", title: "A lab result is ready for one of your patients", body: "Open Laboratory to view it.", category: "clinical", created_at: ago(12), read_at: null, target: "laboratory" },
      { id: "n2", title: "Rota published for next week", body: "Westlands · 13 shifts", category: "operations", created_at: ago(95), read_at: null, target: "staff-scheduling" },
      { id: "n3", title: "Delivery run completed", body: "6 of 7 deliveries completed", category: "operations", created_at: ago(60 * 26), read_at: ago(60 * 20), target: "medicine-delivery" },
    ];
  }
  return [
    { id: "n1", title: "Brian Okello raised purchase order PO-0192", body: "Awaiting your approval", category: "operations", created_at: ago(34), read_at: null, target: "procurement" },
    { id: "n2", title: "Grace Achieng accepted your invitation", body: "Joined as Cashier · Entebbe", category: "people", created_at: ago(180), read_at: null, target: "people" },
    { id: "n3", title: "Payment received for INV-2026-0402", body: "UGX 3,400,000 by bank transfer", category: "billing", created_at: ago(60 * 22), read_at: ago(60 * 21), target: "invoicing" },
    { id: "n4", title: "Your subscription renews in 14 days", body: null, category: "system", created_at: ago(60 * 50), read_at: ago(60 * 49), target: "subscription" },
  ];
}
