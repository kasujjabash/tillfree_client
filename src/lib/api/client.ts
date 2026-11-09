import { apiBasePath, isMockMode } from "@/config/env";
import {
  endSession,
  getAccessToken,
  refreshAccessToken,
  registerRefreshHandler,
} from "@/lib/auth/session";
import { ApiError, type ProblemDetails } from "./errors";

/**
 * The single entry point for talking to Django. Components never call fetch
 * directly; feature `api.ts` modules call `apiRequest`, and hooks wrap those
 * in TanStack Query.
 */

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, QueryValue | QueryValue[]>;
  body?: unknown;
  /** Required for tenant endpoints. There is deliberately no default organisation. */
  organisationId?: string;
  signal?: AbortSignal;
  /** Required by the server on operations with money or stock effects. */
  idempotencyKey?: string;
  /** Internal: used by the refresh call itself. */
  skipAuthRetry?: boolean;
}

/** A fetch-shaped transport. Live mode uses window.fetch; mock mode swaps in src/mocks. */
type Transport = (url: string, init: RequestInit) => Promise<Response>;

let mockTransport: Promise<Transport> | null = null;

function getTransport(): Promise<Transport> {
  if (isMockMode) {
    // Dynamic import keeps sample data out of live bundles entirely.
    mockTransport ??= import("@/mocks/transport").then((m) => m.mockFetch);
    return mockTransport;
  }
  return Promise.resolve((url, init) => fetch(url, init));
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = `${apiBasePath}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (v === undefined || v === null || v === "") continue;
      params.append(key, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function newRequestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

async function toApiError(response: Response, requestId: string): Promise<ApiError> {
  let problem: ProblemDetails | null = null;
  try {
    const body = (await response.json()) as Partial<ProblemDetails>;
    if (body && typeof body === "object" && "code" in body) {
      problem = { title: body.title ?? response.statusText, status: response.status, ...body } as ProblemDetails;
    }
  } catch {
    // Non-JSON error (proxy page, gateway timeout). Fall through to a generic problem.
  }
  const retryAfter = Number(response.headers.get("Retry-After")) || undefined;
  return new ApiError(
    problem ?? {
      title: response.statusText || "Request failed",
      status: response.status,
      code: response.status >= 500 ? "server_error" : "request_failed",
      request_id: response.headers.get("X-Request-ID") ?? requestId,
    },
    retryAfter,
  );
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, organisationId, signal, idempotencyKey, skipAuthRetry } = options;
  const transport = await getTransport();
  const requestId = newRequestId();

  const send = () => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Request-ID": requestId,
    };
    if (typeof document !== "undefined" && document.documentElement.lang) {
      headers["Accept-Language"] = document.documentElement.lang;
    }
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (organisationId) headers["X-Organisation-ID"] = organisationId;
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    return transport(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      // Only auth endpoints need the refresh cookie; it is path-scoped server-side anyway.
      credentials: path.startsWith("/auth/") ? "include" : "same-origin",
      cache: "no-store",
    });
  };

  let response: Response;
  try {
    response = await send();
    if (response.status === 401 && !skipAuthRetry) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        endSession("expired");
        throw await toApiError(response, requestId);
      }
      response = await send();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError({
      title: "Network error",
      status: 0,
      code: "network_error",
      request_id: requestId,
    });
  }

  if (!response.ok) throw await toApiError(response, requestId);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

registerRefreshHandler(async () => {
  try {
    const result = await apiRequest<{ access: string }>("/auth/refresh/", {
      method: "POST",
      skipAuthRetry: true,
    });
    return result.access;
  } catch {
    return null;
  }
});
