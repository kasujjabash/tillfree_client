import type { CalendarDate, Money, Timestamp, UUID } from "@/types/api";

/**
 * PROPOSED CONTRACTS — overview endpoints are not yet specified in the server
 * docs. Each field answers an operational question; nothing here is decorative.
 */

export type Severity = "high" | "medium" | "low";

export interface AttentionItem {
  id: UUID;
  kind: string;
  title: string;
  detail: string;
  severity: Severity;
  due_at: Timestamp | null;
  /** Nav item id the item links to, e.g. "invoicing". */
  target: string | null;
}

/** GET /api/v1/overview/business/?branch= */
export interface BusinessOverview {
  as_of: Timestamp;
  business_date: CalendarDate;
  sales_today: { total: Money; count: number; same_day_last_week: Money | null };
  receivables: { outstanding: Money; open_count: number; overdue: Money; overdue_count: number };
  stock: { low_stock_count: number; out_of_stock_count: number; expiring_30d_count: number };
  attention: AttentionItem[];
  recent_sales: {
    id: UUID;
    reference: string;
    branch_name: string;
    occurred_at: Timestamp;
    payment_method: "cash" | "mobile_money" | "card" | "bank_transfer" | "credit";
    items_count: number;
    total: Money;
    status: "completed" | "refunded" | "partially_refunded";
  }[];
}

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

/** GET /api/v1/overview/healthcare/?branch= */
export interface HealthcareOverview {
  as_of: Timestamp;
  business_date: CalendarDate;
  appointments_today: {
    id: UUID;
    starts_at: Timestamp;
    /** null when the viewer lacks healthcare.patient.read; the server omits the name. */
    patient: { display_name: string } | null;
    service: string;
    setting: "home" | "facility" | "virtual";
    professional_name: string;
    status: AppointmentStatus;
  }[];
  counts: {
    home_visits_next_7d: number;
    bedside_assignments_active: number;
    professionals_on_duty: number;
    professionals_rostered_today: number;
    lab_requests_pending: number;
    lab_requests_overdue: number;
    deliveries_in_transit: number;
    deliveries_due_today: number;
  };
  tasks: AttentionItem[];
}
