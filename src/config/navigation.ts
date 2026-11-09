import {
  Boxes,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  FolderOpen,
  HeartPulse,
  Home,
  Landmark,
  LayoutGrid,
  type LucideIcon,
  Package,
  Pill,
  Plug,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Truck,
  UserRound,
  Users,
  Wallet,
  BedDouble,
  Contact,
  ChartColumn,
} from "lucide-react";

import type { Industry } from "@/types/api";

/**
 * The navigation registry: one declaration per destination. The sidebar,
 * command menu, breadcrumbs and route guard all read from here, so a module
 * is added in one place.
 *
 * `module` — the entitlement that must be enabled for the organisation.
 * `permission` — the permission the member needs to see the destination.
 * Both are UX filters only. Django enforces them on every request.
 *
 * `status: "planned"` routes resolve to a "not built yet" screen rather than a 404,
 * so the information architecture can be reviewed before every module exists.
 */

export type NavSection = "workspace" | "business" | "healthcare" | "organisation" | "account";

export interface NavItem {
  id: string;
  label: string;
  /** Path below /[organisationSlug]/ */
  path: string;
  icon: LucideIcon;
  section: NavSection;
  module?: string;
  permission?: string;
  status: "available" | "planned";
  description?: string;
  /** Extra words that should match in the command menu. */
  keywords?: string[];
}

export const SECTION_LABELS: Record<NavSection, string> = {
  workspace: "Workspace",
  business: "Business",
  healthcare: "Healthcare",
  organisation: "Organisation",
  account: "Account",
};

export const SECTION_INDUSTRY: Partial<Record<NavSection, Industry>> = {
  business: "business",
  healthcare: "healthcare",
};

export const NAV_ITEMS: NavItem[] = [
  // Workspace
  { id: "overview", label: "Overview", path: "overview", icon: LayoutGrid, section: "workspace", status: "available", keywords: ["home", "dashboard"] },
  { id: "reports", label: "Reports", path: "reports", icon: ChartColumn, section: "workspace", module: "platform.reports", permission: "reports.report.view", status: "planned" },
  { id: "documents", label: "Documents", path: "documents", icon: FolderOpen, section: "workspace", module: "platform.documents", permission: "documents.file.view", status: "planned", keywords: ["files"] },

  // Business
  { id: "customers", label: "Customers", path: "business/customers", icon: Contact, section: "business", module: "business.customers", permission: "business.customer.view", status: "planned" },
  { id: "sales", label: "Sales", path: "business/sales", icon: ShoppingCart, section: "business", module: "business.sales", permission: "business.sale.view", status: "planned", keywords: ["pos", "receipts"] },
  { id: "invoicing", label: "Invoicing", path: "business/invoices", icon: Receipt, section: "business", module: "business.invoicing", permission: "business.invoice.view", status: "planned" },
  { id: "products", label: "Products & services", path: "business/products", icon: Package, section: "business", module: "business.catalogue", permission: "business.product.view", status: "planned", keywords: ["catalogue", "items"] },
  { id: "inventory", label: "Inventory", path: "business/inventory", icon: Boxes, section: "business", module: "business.inventory", permission: "inventory.stock.view", status: "planned", keywords: ["stock"] },
  { id: "suppliers", label: "Suppliers", path: "business/suppliers", icon: Truck, section: "business", module: "business.procurement", permission: "procurement.supplier.view", status: "planned" },
  { id: "procurement", label: "Procurement", path: "business/procurement", icon: ClipboardList, section: "business", module: "business.procurement", permission: "procurement.order.view", status: "planned", keywords: ["purchase orders"] },
  { id: "expenses", label: "Expenses", path: "business/expenses", icon: Wallet, section: "business", module: "business.expenses", permission: "business.expense.view", status: "planned" },
  { id: "finance", label: "Finance", path: "business/finance", icon: Landmark, section: "business", module: "business.finance", permission: "finance.ledger.view", status: "planned", keywords: ["accounts"] },

  // Healthcare
  { id: "patients", label: "Patients", path: "healthcare/patients", icon: UserRound, section: "healthcare", module: "healthcare.patients", permission: "healthcare.patient.read", status: "planned" },
  { id: "appointments", label: "Appointments", path: "healthcare/appointments", icon: CalendarDays, section: "healthcare", module: "healthcare.scheduling", permission: "healthcare.appointment.view", status: "planned" },
  { id: "home-care", label: "Home care", path: "healthcare/home-care", icon: Home, section: "healthcare", module: "healthcare.home_care", permission: "healthcare.visit.view", status: "planned", keywords: ["visits"] },
  { id: "bedside-care", label: "Bedside care", path: "healthcare/bedside-care", icon: BedDouble, section: "healthcare", module: "healthcare.bedside_care", permission: "healthcare.assignment.view", status: "planned" },
  { id: "encounters", label: "Clinical encounters", path: "healthcare/encounters", icon: Stethoscope, section: "healthcare", module: "healthcare.clinical", permission: "healthcare.encounter.read", status: "planned" },
  { id: "laboratory", label: "Laboratory", path: "healthcare/laboratory", icon: FlaskConical, section: "healthcare", module: "healthcare.laboratory", permission: "healthcare.lab_request.view", status: "planned", keywords: ["lab", "tests"] },
  { id: "pharmacy", label: "Pharmacy", path: "healthcare/pharmacy", icon: Pill, section: "healthcare", module: "healthcare.pharmacy", permission: "healthcare.dispensing.view", status: "planned" },
  { id: "medicine-delivery", label: "Medicine delivery", path: "healthcare/deliveries", icon: Truck, section: "healthcare", module: "healthcare.delivery", permission: "healthcare.delivery.view", status: "planned" },
  { id: "professionals", label: "Professionals", path: "healthcare/professionals", icon: HeartPulse, section: "healthcare", module: "healthcare.workforce", permission: "healthcare.professional.view", status: "planned", keywords: ["clinicians", "nurses"] },
  { id: "staff-scheduling", label: "Staff scheduling", path: "healthcare/rota", icon: CalendarClock, section: "healthcare", module: "healthcare.workforce", permission: "healthcare.rota.view", status: "planned", keywords: ["rota", "shifts"] },
  { id: "healthcare-billing", label: "Billing", path: "healthcare/billing", icon: CreditCard, section: "healthcare", module: "healthcare.billing", permission: "healthcare.billing.view", status: "planned" },

  // Organisation
  { id: "people", label: "People", path: "people", icon: Users, section: "organisation", permission: "organisations.membership.view", status: "available", keywords: ["members", "users", "staff", "invite"] },
  { id: "branches", label: "Branches", path: "branches", icon: Building2, section: "organisation", permission: "organisations.branch.view", status: "planned", keywords: ["locations"] },
  { id: "roles", label: "Roles & permissions", path: "roles", icon: ShieldCheck, section: "organisation", permission: "organisations.role.view", status: "planned" },
  { id: "modules", label: "Modules", path: "modules", icon: LayoutGrid, section: "organisation", permission: "subscriptions.entitlement.view", status: "planned" },
  { id: "subscription", label: "Subscription", path: "subscription", icon: FileText, section: "organisation", permission: "subscriptions.subscription.view", status: "planned", keywords: ["billing", "plan"] },
  { id: "integrations", label: "Integrations", path: "integrations", icon: Plug, section: "organisation", module: "platform.integrations", permission: "integrations.connection.view", status: "planned" },
  { id: "audit-log", label: "Audit log", path: "audit-log", icon: ScrollText, section: "organisation", permission: "audit.event.view", status: "planned", keywords: ["activity", "history"] },
];

/** Pinned to the sidebar footer rather than a section. */
export const SETTINGS_ITEM: NavItem = {
  id: "settings",
  label: "Settings",
  path: "settings",
  icon: Settings,
  section: "organisation",
  permission: "organisations.settings.view",
  status: "planned",
  keywords: ["preferences", "localisation", "currency", "timezone"],
};

/** Personal pages: reachable from the account menu, never listed in the sidebar. */
export const ACCOUNT_ITEMS: NavItem[] = [
  { id: "profile", label: "Profile", path: "account/profile", icon: UserRound, section: "account", status: "planned" },
  { id: "security", label: "Sign-in & security", path: "account/security", icon: ShieldCheck, section: "account", status: "planned", keywords: ["password", "sessions", "mfa"] },
];

export const ALL_NAV_ITEMS = [...NAV_ITEMS, SETTINGS_ITEM, ...ACCOUNT_ITEMS];

export const SECTION_ORDER: NavSection[] = ["workspace", "business", "healthcare", "organisation"];

export function findNavItem(path: string) {
  return ALL_NAV_ITEMS.find((item) => path === item.path || path.startsWith(`${item.path}/`));
}

export interface AccessLike {
  permissions: ReadonlySet<string>;
  modules: ReadonlySet<string>;
}

export function canSee(item: NavItem, access: AccessLike) {
  if (item.module && !access.modules.has(item.module)) return false;
  if (item.permission && !access.permissions.has(item.permission)) return false;
  return true;
}
