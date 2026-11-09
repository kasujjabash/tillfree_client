/**
 * Access-token handling (see server ADR-0004).
 *
 * - The access token (10 min JWT) lives only in this module's memory. It is
 *   never written to localStorage, sessionStorage or a readable cookie, so an
 *   XSS payload cannot lift a long-lived credential from storage.
 * - The refresh token is an HttpOnly, SameSite=Strict cookie scoped to
 *   /api/v1/auth/. JavaScript never sees it; the browser sends it to
 *   POST /auth/refresh/ and Django rotates it.
 * - Concurrent 401s share one refresh request (single flight).
 */

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

type SessionListener = (reason: "expired" | "signed_out") => void;
const listeners = new Set<SessionListener>();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Registered once by the API client to avoid a circular import. */
export function registerRefreshHandler(handler: () => Promise<string | null>) {
  refreshHandler = handler;
}

/** Returns true when a fresh access token was obtained. */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshHandler) return Promise.resolve(false);
  if (!refreshInFlight) {
    refreshInFlight = refreshHandler()
      .then((token) => {
        accessToken = token;
        return token !== null;
      })
      .catch(() => {
        accessToken = null;
        return false;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export function onSessionEnded(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function endSession(reason: "expired" | "signed_out") {
  accessToken = null;
  listeners.forEach((listener) => listener(reason));
}
