# next-js-template

A Next.js starter that pairs with the Django backend template: session-cookie
auth (email/password + Google) via `django-allauth`, CSRF-aware fetch
helpers, and a websocket helper with the reconnect/close-code rules the
backend expects. Meant to be forked per-project, not used as-is.

## What's here

- `src/lib/api.ts` — CSRF-aware `fetch` wrapper (`api()`) plus thin wrappers
  around the allauth endpoints (session, login, signup, logout, password
  reset, Google redirect) and `/api/config/`.
- `src/lib/auth-context.tsx` — `AuthProvider`/`useAuth()`, wraps the whole app
  in `src/app/layout.tsx`.
- `src/lib/websocket.ts` — `connectWebSocket()`: auto-reconnects with backoff,
  treats close codes `4401`/`4403` as terminal instead of retrying.
- `src/app/auth/{login,signup,callback}` — example pages for the flows
  described in the backend's frontend contract, including the
  access-code-gated signup and the query-param error codes the OAuth redirect
  comes back with.
- `src/components/EchoDemo.tsx` — minimal websocket demo shown on the home
  page once signed in.

Types in `src/lib/types.ts` are hand-written. Once you have a real backend
running, generate them from `/api/schema/` instead (`openapi-typescript` or
`orval`) and delete the hand-written ones.

## Running locally

```bash
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if not localhost:8000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need the Django
backend running (default expected at `http://localhost:8000`) to actually log
in — this template has no backend of its own.

## Running with Docker

```bash
docker compose up
```

Builds a dev container (hot reload via a bind mount) and serves on
`localhost:3000`. Auth/API calls happen in the browser, not inside the
container, so `NEXT_PUBLIC_API_URL` just needs to be reachable from your
host — e.g. `http://localhost:8000` if the backend publishes that port,
whether or not the backend itself is also in Docker. Override it with an
`.env` file or `NEXT_PUBLIC_API_URL=... docker compose up`.

## Notes

- Both the frontend and the backend need to be reachable under the same
  parent domain in production for the session cookie to be sent — see the
  backend's frontend contract doc for details.
- Server components/route handlers don't forward cookies automatically; keep
  auth-bound calls on the client (all the example pages here are
  `"use client"`).
