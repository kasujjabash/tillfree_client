# Unified OS web client: architecture and design (Phase 1–2)

This document covers the frontend foundation and application shell: how the client is structured, how it talks to Django, how tenancy and permissions reach the UI, and the design system. It is the first deliverable for review. Industry modules are not built yet.

Screens for review are in [`docs/screens/`](screens/). They are listed in §10.

The backend design this client follows is in `../Tillfree server/docs/architecture/`, especially 03 (multi-tenancy), 05 (identity and access), 06 (localisation) and 08 (API conventions).

---

## 1. Shape of the client

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict | Routing, code splitting per route, one toolchain |
| Rendering | Workspace screens render in the browser | The access token lives in memory (ADR-0004), so the Next server never holds a credential or tenant data. Nothing clinical is ever cached or prerendered server-side |
| Server state | TanStack Query | Caching, retries, background refresh, cancellation. No Redux or Zustand |
| Local UI state | React state and context | The only shared client state is the workspace context (§4) |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix) | Accessible primitives we own and can restyle |
| Forms | React Hook Form + Zod | One schema validates the input and types the form |
| Tables | TanStack Table, in server-driven mode | Sorting, filtering and pagination happen in Django |
| HTTP | `fetch` behind one client (`lib/api/client.ts`) | No Axios: native fetch covers cancellation, and the transport can be swapped for mocks |
| Charts | Recharts, added with the first chart | The shell needs no chart, and a decorative one would break the "every figure answers a question" rule |

`cacheComponents` (Next 16's server caching) is switched off on purpose (see `next.config.ts`). There is no server-side data to cache, and tenant data must never land in a shared server cache.

## 2. Folder structure

```text
src/
├── app/                          Routes only: thin pages that render a feature screen
│   ├── (auth)/                   sign-in, forgot-password            (public)
│   ├── (onboarding)/             select-organisation                 (signed in, no tenant)
│   ├── (workspace)/[organisationSlug]/
│   │   ├── layout.tsx            RequireAuth → WorkspaceProvider → AppShell
│   │   ├── overview/  people/    built screens
│   │   ├── [...rest]/            every other registered route: "not built yet", restricted, or 404
│   │   └── error.tsx             per-page error boundary (the shell stays usable)
│   └── error.tsx, not-found.tsx
├── components/
│   ├── ui/                       shadcn primitives (owned code, restyled through tokens)
│   ├── layout/                   AppShell, AppSidebar, TopBar, Page/PageHeader, CenteredLayout
│   ├── navigation/               organisation switcher, branch switcher, command menu, user and help menus
│   ├── tables/                   DataTable + controls (search, facet filter, sort header, columns)
│   ├── data-display/             SummaryStrip
│   ├── feedback/                 Empty, Error and Loading states, StatusBadge
│   └── brand/                    logo mark
├── features/                     One folder per domain: api.ts (requests + hooks), types.ts, components/
│   ├── authentication/  organisations/  workspace/  memberships/  overview/  notifications/
│   ├── business/  healthcare/    (Phase 5)
├── config/                       env.ts (public config), navigation.ts (the route/module/permission registry)
├── lib/
│   ├── api/                      client.ts, errors.ts (RFC 9457), query-keys.ts
│   ├── auth/session.ts           in-memory access token, single-flight refresh
│   └── formatting/               money, numbers, dates, relative time (Intl)
├── hooks/                        use-debounced-value, use-cursor-pagination, use-mobile
├── providers/                    QueryClient, Auth, Tooltip, Toaster
├── mocks/                        SAMPLE DATA ONLY, loaded only in mock mode (§6)
└── types/api.ts                  shared wire types
```

Rules:
- Pages in `app/` contain no logic; they render a feature screen.
- Components never call `fetch`. Requests live in `features/*/api.ts` and are exposed as hooks.
- A feature may import from `components/`, `lib/` and other features' public hooks. `components/` never imports from `features/`, except `layout/` and `navigation/`, which compose the shell.

## 3. Navigation registry

`src/config/navigation.ts` declares every destination once: label, path, icon, section, **module** (entitlement) and **permission**. The sidebar, the command menu, the breadcrumbs and the catch-all route all read from it.

- A destination shows only when the organisation has the module **and** the member holds the permission.
- The Business and Healthcare sections appear only for organisations in that industry. An organisation can have both; the overview then shows tabs.
- Registered but unbuilt routes show a "not built yet" page, so the full information architecture can be reviewed now. A route the member can't use says why: "module not enabled" or "no access". An unknown route is a 404.

**This is presentation, not security.** Hiding a link prevents confusion, not access. Django authorises every request (`authorize()`, RLS), and the client handles 403 and 404 responses gracefully.

## 4. Authentication, organisations and switching

**Session (follows ADR-0004).**
- The access token is held in a module variable: never in localStorage, sessionStorage or a readable cookie.
- The refresh token is an HttpOnly, SameSite=Strict cookie scoped to `/api/v1/auth/`. JavaScript never sees it.
- On load, `AuthProvider` calls `POST /auth/refresh/`. If that works, the user is signed in; otherwise they go to sign-in.
- A 401 on any request triggers one shared refresh, then the request is retried once. If the refresh fails, the session ends: the whole query cache is cleared and the user lands on `/sign-in?reason=session_expired&next=…`.
- `next` accepts only same-site relative paths, to prevent open redirects.
- **Same-origin requirement:** the Next.js rewrite proxies `/api/v1/*` to `DJANGO_API_ORIGIN`, so the SameSite=Strict cookie works without CORS.

**Organisation context (follows 03 and 05).**
- The active organisation is in the URL: `/{organisationSlug}/…`. There is no default organisation, even for single-organisation users, and two tabs can work in two organisations at once, as the backend design intends.
- `WorkspaceProvider` resolves the slug against `GET /me/memberships/` and then loads `GET /me/access/` (see §7).
- Every tenant request passes `organisationId` explicitly; the client sends it as `X-Organisation-ID`. No global "current org" variable feeds requests.

**Cache isolation on switch.**
- Every tenant query key starts with `["org", orgId, …]`.
- On entering an organisation, the provider removes every `["org", otherId, …]` entry, so one tenant's data can never render in another's workspace, even for a frame.
- User-level data (`["me", …]`) survives the switch.

**Branch context.**
- The branch switcher offers only the member's permitted branches, plus "All branches" when one of their roles is unscoped.
- The selection is remembered per organisation (an id in localStorage) and passed as `?branch=` to branch-aware endpoints.
- Formatting uses the branch timezone, falling back to the user's timezone, then the organisation's.

## 5. Django API integration

| Concern | Implementation |
|---|---|
| Base path | `/api/v1/`, same-origin through the Next rewrite |
| Headers | `Authorization`, `X-Organisation-ID`, `X-Request-ID` (generated per request), `Accept-Language`, and `Idempotency-Key` where needed |
| Errors | Every failure becomes an `ApiError` parsed from problem+json (`status`, `code`, `fieldErrors`, `requestId`). Screens show human copy via `describeError()` and display the request reference on error states |
| Validation errors | Field errors (`errors[].field`) are mapped onto form fields with `setError` (see the invite form) |
| Pagination | Cursor pagination with `results/next/previous`. `useCursorPagination` keeps a stack of cursors for Previous; the table shows "Showing 26–50" without a total, because cursor pagination has none |
| Retries | Queries retry network errors and 5xx twice and never retry 4xx. Mutations never retry automatically; they use idempotency keys instead |
| Duplicate submissions | Submit buttons are disabled while pending, and the invite dialog uses one `Idempotency-Key` per open dialog |
| Cancellation | TanStack Query's `signal` is passed through to `fetch` |
| Money | `{amount: string, currency}` stays a string all the way to `Intl.NumberFormat` (which accepts decimal strings exactly). No float arithmetic and no conversion |

## 6. Mock mode (sample data)

The backend's Phase 2 endpoints don't exist yet, so `NEXT_PUBLIC_API_MODE=mock` swaps the transport in `lib/api/client.ts` for `src/mocks/transport.ts`.

- It enforces the documented contract, so the real code paths run. It requires the bearer token, resolves `X-Organisation-ID` (404 for non-members), returns 403 for missing permissions, uses cursor pagination, and sends problem+json errors.
- It is loaded with a dynamic `import()`, so live builds contain no sample data.
- While it is on, a **"Sample data"** label shows in the top bar and the sign-in page says no backend is contacted, so sample figures are never mistaken for real data.
- A production build refuses mock mode unless `NEXT_PUBLIC_ALLOW_MOCK_IN_PRODUCTION=true` is set (for design-review deployments only).

Sample data covers three fictional organisations:

| Organisation | Industry | Country | Your role | What it demonstrates |
|---|---|---|---|---|
| Nile Valley Traders | Business | UGX, Uganda | Owner | All three branches visible |
| Kijani Home Health | Healthcare | KES, Kenya | Care coordinator | Restricted to one branch; no invite, settings or audit access; pharmacy and billing modules not enabled |
| Lakeview Pharmacy | Business | Tanzania | — | A pending invitation |

## 7. API contracts the backend needs to add

The server docs don't yet define these. The client is written against the shapes in `src/types/api.ts` and `src/features/*/types.ts`:

1. **`GET /api/v1/me/access/`** (tenant). Returns the organisation, the membership's roles, effective permission codes, entitled module codes, permitted branches and `all_branches`. The UI needs this to shape navigation; it is the client-side mirror of `authorize()`'s inputs.
2. **`industries` on the organisation**, or a derivation rule from modules, to choose the overview experience.
3. **`GET /api/v1/overview/business/` and `/overview/healthcare/`** (`?branch=`). Aggregates for the overview screens. Patient names are returned only to members with `healthcare.patient.read`.
4. **`POST /memberships/{id}/suspend/` and `/reactivate/`**, and **`GET /roles/`** including each role's highest permission `sensitivity`, which the invite form uses to warn about sensitive and clinical grants.
5. **Notifications** with a `target` (a navigation id), and **no patient identifiers in clinical notification text**.
6. **Module and permission codes** (e.g. `healthcare.home_care`, `business.invoice.view`) must match the server's permission registry. The codes in `navigation.ts` are proposals.

## 8. Design system

**Direction.** Calm, dense and typographic, in the manner of Linear's navigation and Stripe's data screens, with its own identity:
- a grey sidebar, with work happening in a white inset panel
- borders instead of shadows, and colour only for meaning
- no gradients, glass effects, emoji or decorative charts

I worked from my knowledge of those products' patterns rather than from screenshots captured for this round.

**Tokens** (`src/app/globals.css`, OKLCH):

| Token | Value | Use |
|---|---|---|
| `--primary` | Deep blue `oklch(0.455 0.165 262)` ≈ #2A4DB8 | Primary actions, focus, selection, unread markers |
| `--background` / `--surface` | Off-white ≈ #F8F9FA / white | Canvas and sidebar / content panel, dialogs, tables |
| `--foreground` / `--muted-foreground` | Charcoal ≈ #1C1F26 / slate grey (4.9:1 on white) | Text / secondary text |
| `--border`, `--border-strong`, `--input` | Neutral slate greys | Dividers, controls |
| `--success`, `--warning`, `--destructive` (+ `-subtle`) | Restrained green, amber, muted red | Status text plus a tinted background, never large fills |

**Type.** Inter, with a 14px base and utilities instead of ad-hoc sizes:

| Utility | Size | Use |
|---|---|---|
| `text-page-title` | 20px | Page titles |
| `text-section-title` | 15px | Section headings |
| `text-body` | 14px | Body text |
| `text-label` | 13px | Labels |
| `text-meta` | 12px | Metadata |
| `text-overline` | 11px uppercase | Sidebar group labels |

Tables use tabular numbers.

**Radius and density.** 8px base radius; 32px controls; 48px table rows; a 48px top bar.

**Components.** The shadcn/ui primitives (button, input, select, dropdown, dialog, sheet, tabs, badge, tooltip, breadcrumb, table, pagination, popover, command, checkbox, alert dialog, field, toast) are restyled through tokens. On top of them sit the Unified OS pieces:
- `Page`, `PageHeader`, `SectionHeader`: the page structure is always title → description → primary action → toolbar → content
- `SummaryStrip`: one bordered strip of key figures instead of floating metric cards
- `DataTable` and its controls
- `StatusBadge` and `StatusDot`: always text plus a dot, never colour alone
- `EmptyState` and `ErrorState`: one sentence, one action; errors show the request reference

**Accessibility (WCAG 2.2 AA intent).**
- A skip link, and visible focus on every control
- Labelled fields, with `aria-invalid` and `role="alert"` on errors
- `aria-sort` on sortable headers and `aria-current` in navigation
- Radix dialogs and menus provide focus trapping and keyboard support
- Status is never conveyed by colour alone
- Reduced motion is respected
- Everything is keyboard-reachable: ⌘K for search, ⌘B for the sidebar

**Responsive.**
- The sidebar becomes a sheet below 768px.
- Tables become stacked records on mobile.
- The summary strip reflows to two columns.
- The top bar drops the search field for an icon, and drops the sample-data label.

## 9. Healthcare and privacy in the UI

- Overviews show no clinical detail (diagnoses, notes or results). Patient names appear only when the API returns them, and a **"Hide patient names"** control covers shared or public screens.
- Patient data never goes into URLs, localStorage or notifications. The only values in browser storage are the last organisation slug, branch ids per organisation, and the sidebar state.
- Granting a clinical role shows a warning that the grant is audited and owners are notified (matching 05 §6).
- Healthcare screens beyond the overview wait for the clinical sign-off the backend roadmap requires (10 §1, Phase 5).

## 10. Screens in this round

| # | Screen | Shows |
|---|---|---|
| 01–02 | Sign in | Sample-data hint; generic invalid-credentials error |
| 03 | Choose an organisation | Memberships, roles, pending invitation |
| 04 | Business overview | Summary strip, needs-attention list, recent sales; branch-aware |
| 05 | Organisation switcher | |
| 06–10 | People | Server-driven table, facet filter, bulk selection, invite form validation, sensitive-role warning |
| 11 | Command menu (⌘K) | |
| 12 | Notifications | |
| 13 | Healthcare overview | Different organisation, country, role and modules |
| 14–15 | Unbuilt and restricted routes | "Not built yet" page; module not enabled |
| 16 | Collapsed sidebar | |
| 17–19 | Mobile | Stacked people list, healthcare overview, navigation sheet |
| 20 | Tablet overview | |

## 11. Not done yet, and next steps

1. **URL-synced table state.** Search, filters and sort on People are local state today; they should move to the query string so views can be shared.
2. **Remaining auth screens:** reset-password (token) form, email verification, MFA challenge, and invitation acceptance. All depend on Phase 2 endpoints.
3. **Organisation onboarding (create organisation)** with a country → currency, timezone and locale cascade from reference data.
4. **Tests.** Vitest and Testing Library for `lib/` (formatting, client error and refresh paths, cursor pagination), and Playwright for the auth → switch → isolation flow. The review screenshots came from a throwaway headless-Chrome script, which should be replaced by a proper e2e suite.
5. **Translations.** Strings are English-only and inline. An i18n layer (e.g. `next-intl`) should come in before a second language. Formatting is already locale-driven.
6. **A dark theme.** The tokens exist, but no toggle ships yet.
7. **Then Phase 4 (core platform screens), followed by Phase 5,** starting with the healthcare pilot workflows once they have been validated with clinicians.
