# SRCGo Web

A web port of the [SRCGo](https://github.com/SRCGO) mobile app. Authenticates with UCR's CAS system and displays your CODE128 membership barcode for entry to the UCR Student Recreation Center — no app install required.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + TailwindCSS (Vite) |
| Backend | Node.js + Express + TypeScript |
| Deployment | Vercel (serverless functions) |

---

## Project Structure

```
SRCGo-Web/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions — lint, type-check, format check
├── .husky/
│   └── pre-commit          # Local git hook — same checks before every commit
├── frontend/               # Vite + React app (port 8000 in dev)
│   ├── src/
│   │   ├── components/
│   │   │   ├── barcode/    # BarcodeDisplay (jsbarcode SVG renderer)
│   │   │   ├── layout/     # Sidebar (desktop), BottomNav (mobile)
│   │   │   └── ui/         # Button, Card, Input, Switch
│   │   ├── context/        # AuthContext, SettingsContext
│   │   ├── hooks/          # useBarcode (polling + auto-refresh)
│   │   ├── pages/          # LoginPage, BarcodePage, SettingsPage
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Constants (timing, storage keys, demo mode)
│   ├── eslint.config.js
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── backend/                # Express dev server + Vercel serverless handlers
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts    # POST /api/auth/login  — UCR CAS auth flow
│   │   │   └── session.ts  # DELETE /api/auth/session  — logout
│   │   └── barcode.ts      # GET /api/barcode  — InnoSoft barcode fetch
│   ├── eslint.config.mjs
│   └── server.ts           # Local Express server (wraps Vercel handlers)
├── .gitignore
├── .prettierrc
├── Makefile
├── package.json            # Root — husky only
└── vercel.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
make setup
```

This installs dependencies in `frontend/`, `backend/`, and the root (husky).

### Run locally

```bash
make dev
```

Starts both servers with hot reload:

| Server | URL |
|---|---|
| Frontend (Vite) | http://localhost:8000 |
| Backend (Express) | http://localhost:3000 |

The frontend proxies all `/api` requests to the backend, so you only need to open `localhost:8000`.

---

## Authentication

Login uses your UCR NetID credentials. The app runs a 4-step server-side auth flow through UCR's CAS system to obtain a session token from InnoSoft Fusion — the same flow the mobile app uses.

**Remember Me** (on by default) stores your credentials in `localStorage` so the app can silently re-authenticate when your session expires (~1 hour) without sending you back to the login screen.

### Demo mode

Login with username `demo` and any password to try the app without real UCR credentials. Barcodes cycle through sample values automatically.

---

## Barcode

The barcode auto-refreshes every 12 seconds (configurable in Settings). You can also tap the barcode to highlight it with a gold glow for easier scanning in bright environments.

---

## Code Quality

```bash
make lint      # ESLint on frontend + backend
make format    # Prettier auto-format on frontend + backend
```

**Pre-commit hook** (Husky): type-check → lint → format check runs automatically before every `git commit`.

**CI** (GitHub Actions): same checks run on every push and pull request to `main`.

---

## Deployment

The app is configured for Vercel out of the box via `vercel.json`:

- Frontend is built with Vite and served as a static SPA
- Backend API routes are deployed as Vercel serverless functions under `/api`

```bash
vercel deploy
```
