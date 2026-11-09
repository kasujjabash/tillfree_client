/**
 * RFC 9457 problem+json, as produced by the Django global exception handler.
 * Every failed request in the client surfaces as an ApiError.
 */
export interface ProblemFieldError {
  field: string;
  code: string;
  message: string;
}

export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  request_id?: string;
  errors?: ProblemFieldError[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail?: string;
  readonly requestId?: string;
  readonly fieldErrors: ProblemFieldError[];
  readonly retryAfterSeconds?: number;

  constructor(problem: ProblemDetails, retryAfterSeconds?: number) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.detail = problem.detail;
    this.requestId = problem.request_id;
    this.fieldErrors = problem.errors ?? [];
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * A short sentence safe to show to the user. Server messages are already
 * translated and contain no internals (500s carry only a request id), but we
 * still prefer our own wording for the common cases.
 */
export function describeError(error: unknown): string {
  if (!isApiError(error)) return "Something went wrong. Please try again.";
  if (error.isNetworkError) return "We couldn't reach the server. Check your connection and try again.";
  switch (error.code) {
    case "permission_denied":
      return "You don't have permission to do this.";
    case "module_not_enabled":
      return "This module isn't enabled for your organisation.";
    case "branch_not_permitted":
      return "You don't have access to this branch.";
    case "rate_limited":
      return error.retryAfterSeconds
        ? `Too many attempts. Try again in ${error.retryAfterSeconds} seconds.`
        : "Too many attempts. Please wait a moment and try again.";
    case "not_found":
      return "We couldn't find that. It may have been removed, or you may not have access.";
    case "server_error":
      return "Something went wrong on our side. Please try again.";
    default:
      return error.detail || error.message;
  }
}
