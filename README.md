# Unified OS: web client

The Next.js frontend for Unified OS, a multi-tenant operating system for organisations. The backend is the Django REST API in `../Tillfree server`.

**Architecture and design decisions:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). **Screens for review:** [docs/screens/](docs/screens/).

## Run it

You need Node 20 or later.

```bash
npm install
cp .env.example .env.local   # mock mode by default: no backend needed
npm run dev                  # http://localhost:3000
```

In mock mode, sign in with `amina@example.com` and `demo-password`. All data is fictional sample data from `src/mocks/`, and the app labels it as such.

To use Django instead, set these in `.env.local` and run the API on port 8000:

```
NEXT_PUBLIC_API_MODE=live
DJANGO_API_ORIGIN=http://127.0.0.1:8000
```

Requests to `/api/v1/*` are proxied to Django on the same origin, so the HttpOnly refresh cookie works.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve (mock mode is refused in production builds) |
| `npm run lint` | ESLint (Next.js + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |

## Where things go

- **A new screen:** add an entry to `src/config/navigation.ts` (with its module and permission), build the screen in `src/features/<domain>/components/`, and add a thin `page.tsx` under `src/app/(workspace)/[organisationSlug]/`.
- **A new API call:** add a function and hook in `src/features/<domain>/api.ts` using `apiRequest`. Tenant calls pass `organisationId` and use `queryKeys.org(orgId)…` keys.
- **UI primitives:** `src/components/ui/` (shadcn; edit freely). Shared app components go in `src/components/*`.
