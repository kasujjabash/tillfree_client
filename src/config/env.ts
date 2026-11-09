/**
 * Public, build-time configuration. Only NEXT_PUBLIC_* values reach the browser;
 * nothing secret belongs here.
 */
export type ApiMode = "mock" | "live";

export const apiMode: ApiMode = process.env.NEXT_PUBLIC_API_MODE === "mock" ? "mock" : "live";

export const isMockMode = apiMode === "mock";

if (
  isMockMode &&
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ALLOW_MOCK_IN_PRODUCTION !== "true"
) {
  throw new Error(
    "NEXT_PUBLIC_API_MODE=mock is not allowed in a production build. " +
      "Set NEXT_PUBLIC_API_MODE=live, or NEXT_PUBLIC_ALLOW_MOCK_IN_PRODUCTION=true for a review deployment.",
  );
}

/** Same-origin by default; the Next.js rewrite forwards /api/v1/* to Django. */
export const apiBasePath = "/api/v1";

export const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL || null;
export const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL || null;
