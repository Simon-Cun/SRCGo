# CLAUDE.md

## Project Overview

SRCGo Web is a Vercel-hosted web app that ports the SRCGo React Native mobile app to the browser. It authenticates with UCR's InnoSoft/CAS system and displays a time-refreshing CODE128 barcode used for building access at UCR.

## Project Structure

```
/
├── CLAUDE.md
├── vercel.json          ← build + routing config for Vercel
├── frontend/            ← Vite + React + TypeScript + TailwindCSS
└── backend/             ← Node.js TypeScript serverless functions
    └── api/
        ├── auth/
        │   ├── login.ts     POST /api/auth/login
        │   └── session.ts   DELETE /api/auth/session (logout)
        └── barcode.ts       GET /api/barcode
```

## Commands

```bash
# Install dependencies
cd frontend && npm install
cd backend && npm install

# Local development (run both concurrently)
vercel dev          # serves backend API on :3000
cd frontend && npm run dev   # Vite dev server on :5173 (proxies /api → :3000)

# Build frontend
cd frontend && npm run build

# Deploy
vercel deploy
```

## Architecture

### Why a Backend is Required

The 4-step UCR CAS auth flow cannot run in the browser:
- CORS blocks cross-domain requests to InnoSoft/UCR endpoints
- Cookie handling across multiple domains requires a server-side cookie jar
- The flow depends on redirect interception and mobile User-Agent spoofing

### Auth Flow (4 steps)

1. GET `https://innosoftfusiongo.com/sso/login/login-start.php?id=124` — init session
2. GET `https://auth.ucr.edu/cas/login?service=<url>` — extract `execution` token from HTML
3. POST `https://auth.ucr.edu/cas/login` — submit credentials, capture service ticket from redirect
4. POST `https://innosoftfusiongo.com/sso/login/login-finish.php` — get `fusion-token` response header

### Session Management

- Backend sets an httpOnly cookie `srcgo_session` containing the fusion-token
- Frontend never sees the token (XSS-safe)
- Cookie expires in 1 hour (matching InnoSoft token lifetime)
- On expiry, silent re-auth using credentials stored in localStorage (if "Remember Me" was on)

### Barcode

- GET `/api/barcode` → backend calls InnoSoft with Bearer token → returns `{ barcodeId }`
- Frontend renders CODE128 barcode via `jsbarcode` into an SVG ref
- Auto-refreshes every 12 seconds with countdown timer
- Demo mode: login with username `demo` for testing without real credentials

## Design System

Colors, spacing, and typography are translated 1:1 from SRCGo's mobile theme tokens into TailwindCSS. See `frontend/tailwind.config.ts` for all values.

Key colors:
- Primary Blue: `#003DA5`
- Blue Dark: `#002D7A`
- Gold: `#FFB81C`
- Error: `#F44336`

## Key Dependencies

- **Backend**: `axios`, `axios-cookiejar-support`, `tough-cookie`, `cookie`
- **Frontend**: `react`, `react-router-dom`, `jsbarcode`, `tailwindcss`, `vite`
