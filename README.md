# Easy Vyapaar Web App

**Easy Vyapaar** is a retail ERP platform for Indian shops—electronics, kirana, apparel, and general trade. Shop owners manage billing, inventory, GST-ready invoices, and daily operations from one dashboard.

Easy Vyapaar is a product of **ZEROKNOW TECHNOLOGY PRIVATE LIMITED**.

This repository is the **Next.js web application** (frontend + BFF API routes) for authentication, onboarding, and the authenticated app shell. It talks to the separate **Easy Vyapaar backend** for OTP, registration, and business data.

## What this repo includes

| Area | Description |
|------|-------------|
| **Auth UI** | Login and register flows (mobile OTP, optional GST verification, language selection) |
| **BFF routes** | `app/api/authentication/*` proxies requests to the backend and sets the session cookie |
| **Localization** | Multi-language UI (English + Indian languages) with locale persisted in the browser |
| **Route protection** | `proxy.ts` guards `/dashboard` and redirects logged-in users away from `/auth/*` |
| **Brand & UX** | Easy Vyapaar navy/orange design system, decorative login panel, responsive layouts |

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+ (or pnpm/yarn/bun)
- Running **Easy Vyapaar backend** (for auth APIs) when testing login/register end-to-end

## Clone and run

```bash
git clone <repository-url>
cd easydukan-webapp

npm install

cp .env.example .env.local
# Edit .env.local with your backend URL and app URL

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Login: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
- Register: [http://localhost:3000/auth/register](http://localhost:3000/auth/register)

### Other scripts

```bash
npm run build   # production build
npm run start   # run production server (after build)
npm run lint    # ESLint
```

## Environment variables

Copy `.env.example` to `.env.local` (gitignored). Never commit secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes (for auth) | Base URL of the Easy Vyapaar backend API (e.g. `http://localhost:8080/api/`) |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of this web app (SEO/canonical links). Defaults to `http://localhost:3000` in dev |
| `NODE_ENV` | Auto | Set by Next.js (`development` / `production`) |

`VERCEL_URL` is set automatically on Vercel deployments.

Example `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Without `NEXT_PUBLIC_API_URL`, authentication API routes cannot reach the backend.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Project layout (high level)

```
app/
  auth/login, auth/register    # Auth pages
  api/authentication/          # BFF: OTP, register, GST check
  dashboard/                   # Post-login shell (protected)
components/login, register/    # Auth UI
lib/localization/              # i18n messages and provider
lib/api/                       # Backend URL helpers
proxy.ts                       # Auth route middleware
```

## License

**Proprietary — All Rights Reserved.**

This software is the private property of **ZEROKNOW TECHNOLOGY PRIVATE LIMITED** (Easy Vyapaar product). See [LICENSE](./LICENSE) for terms. Unauthorized copying, distribution, modification, or use is prohibited.
