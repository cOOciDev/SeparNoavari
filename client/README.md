# Separ Noavari Client

A React 19 + Vite + TypeScript single-page application for the Separ Noavari innovation program. The UI uses Ant Design, React Query, and i18next (with automatic RTL) and communicates with the Express/Mongo API exposed by the server workspace.

## Prerequisites
- Node.js 18+
- npm 9+

## Installation
```bash
npm install
```

## Environment
Create `client/.env` (you can copy `.env.example`) and configure at least:
```
VITE_API_BASE=/api
VITE_DEFAULT_LOCALE=fa
```
Adjust `VITE_API_BASE` if the API is served from another origin (for example `http://127.0.0.1:5501/api`).

## Scripts
```bash
npm run dev        # start Vite dev server with HMR
npm run build      # type-check then create production bundle
npm run preview    # preview the production build locally
npm run lint       # run eslint checks
npm run test       # run Vitest + RTL suites
```

## Testing
Vitest and React Testing Library live under `src/__tests__`.
- `smoke.test.tsx` covers the core flow (login form call, idea submission, listings, detail view).
- `components.test.tsx` validates IdeaForm, ReviewForm, AssignmentModal, and the role guards.

Run all tests with:
```bash
npm run test
```

## API integration
All HTTP calls go through `src/service/api.ts` (axios with `withCredentials` and `Accept-Language` derived from i18next). Ensure the Express API provides the new `/auth`, `/ideas`, `/judge`, and `/admin` endpoints backed by MongoDB + connect-mongo sessions.

## Project structure (excerpt)
```
src/
  app/                # App entry and providers (Query, i18n, Ant theme)
  components/         # Shared UI widgets and forms
  pages/              # Route-level pages (landing, auth, ideas, judge, admin)
  service/            # API clients and React Query hooks
  AppData/            # Static data (tracks, committee) + i18n resources
  __tests__/          # Vitest suites
  test/               # Testing utilities & setup
```

## Localization
Translations live in `src/AppData/i18n/locales/en.json` and `fa.json` (UTF-8, no BOM). RTL mode is enabled automatically whenever the active language starts with `fa`.

## Notes
- Role checks use uppercase roles (`ADMIN | JUDGE | USER`).
- Mutations invalidate the appropriate React Query keys (`['me']`, `['ideas','mine']`, etc.).
- Uploaded files are referenced through `files[].path`; ensure the server continues to expose those paths.
