# Nanocode demo UI (React + TypeScript + Vite)

Single-page UI that showcases the existing Nanocode wrapper. All calls go to the backend endpoints described in the root README:

- `POST /nanocode` — used across all tabs with different constraint presets.
- `GET /health` — used for the global health indicator.

## Prerequisites

- Node 18+ (Vite recommends 20.19+; Node 20.6 works with warnings).
- npm.

## Install dependencies

```bash
cd frontend
npm install
```

## Configure API base URL

Set the Nanocode wrapper URL via environment variable (defaults to `http://localhost:8000`):

```bash
echo "VITE_NANOCODE_API_BASE_URL=http://localhost:8000" > .env
```

## Run the dev server

```bash
npm run dev
```

Then open the URL shown in the terminal (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

The compiled assets are emitted to `frontend/dist`.

## What the UI shows

- **Constraint Playground**: enter a user request + constraints, view live output, heuristic constraint satisfaction, and an “internal prompt” preview.
 - **Idea → Spec → Tests**: three-step workflow (each calls `/nanocode`) to turn an idea into a spec, tests, and a risk summary.
- **Audience Switcher**: one click to generate tailored outputs for exec/PM/dev/legal audiences with tone/length controls.
- **Health Indicator**: polls `/health` on load and periodically to show wrapper status.
- **Request/Response Inspector**: toggle to see the last request body and response body sent to `/nanocode`.
