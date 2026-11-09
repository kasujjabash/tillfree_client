import type { Timestamp, UUID } from "@/types/api";

/**
 * In-app notification. For clinical events the server sends a generic title
 * ("A lab result is ready") and no patient identifiers; details are fetched
 * only after the user opens the record, under normal access checks.
 */
export interface AppNotification {
  id: UUID;
  title: string;
  body: string | null;
  category: "system" | "people" | "operations" | "clinical" | "billing";
  created_at: Timestamp;
  read_at: Timestamp | null;
  /** Nav item id to open, if any. */
  target: string | null;
}
