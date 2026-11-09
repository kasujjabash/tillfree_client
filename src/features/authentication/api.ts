import { apiRequest } from "@/lib/api/client";
import type { User } from "@/types/api";

export function login(input: { email: string; password: string }) {
  return apiRequest<{ access: string }>("/auth/login/", { method: "POST", body: input, skipAuthRetry: true });
}

export function logout() {
  return apiRequest<void>("/auth/logout/", { method: "POST", skipAuthRetry: true });
}

export function requestPasswordReset(input: { email: string }) {
  return apiRequest<void>("/auth/password/reset/", { method: "POST", body: input, skipAuthRetry: true });
}

export function getMe(signal?: AbortSignal) {
  return apiRequest<User>("/me/", { signal });
}

/** Only same-site relative paths are accepted as post-login destinations (no open redirects). */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
