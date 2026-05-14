# TravelAI

TravelAI is organized as a single repository with separate frontend and backend modules.

```text
TravelAI/
  frontend/   Vite + React MVP UI
  backend/    Express + TypeScript API module
  docs/       Product, design, and technical notes
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server uses Vite and defaults to <http://localhost:5173>.

## Backend

The backend directory is scaffolded for the API described in `docs/MVP-后端模块设计.md`.

```bash
cd backend
npm install
npm run dev
```

The first backend milestone should expose mock API endpoints for local frontend integration.
