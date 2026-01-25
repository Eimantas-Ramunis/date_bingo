# Agents & Context

## Project Goals
Date Bingo is a self-hosted tool to help reduce relationship burnout by planning dates proactively. It prioritizes privacy (local DB), simplicity (admin/receiver roles), and low friction (tokenized links).

## Architecture
- Node.js/Express backend (ES modules, `server/src`).
- React + Vite frontend (Tailwind CSS, `client/src`).
- SQLite database via Prisma (local file DB).
- Docker deployment for single-host setup.

## Repository Layout
- `server/src/index.js`: Express app entry.
- `server/src/routes/*.routes.js`: Route definitions.
- `server/src/controllers/*Controller.js`: Request handlers.
- `server/src/middleware/*.js`: Auth, rate limiting, error handling.
- `server/src/utils/db.js`: Prisma client singleton.
- `server/prisma`: Schema, migrations, and seed.
- `client/src/App.jsx`: Router and top-level layout.
- `client/src/pages/*`: React pages.
- `client/src/api.js`: Axios instance for `/api`.
- `docker-compose.yml`: Production-ish container run.

## Build, Run, and Dev Commands
- Docker (prod-like): `docker compose up -d --build`.
- Server dev:
  - `cd server`
  - `npm install`
  - `npx prisma generate`
  - `npx prisma migrate dev --name init`
  - `npm run seed`
  - `npm run dev`
- Server start (non-watch): `cd server && npm start`.
- Client dev:
  - `cd client`
  - `npm install`
  - `npm run dev`
- Client build/preview:
  - `cd client && npm run build`
  - `cd client && npm run preview`

## Linting and Tests
- No lint or formatting scripts are configured in `package.json`.
- No automated test runner is configured (no single-test command available).
- If you add tests later, document the single-test command in this file.

## Manual QA Checklist
1. Login as `admin` / `admin123`.
2. Create a Date Idea (or use seeded data).
3. Click "Suggest 3" -> select one -> enter hint details.
4. Copy Hint link -> open in incognito -> verify it loads (Hint view).
5. Copy Reveal link -> open in incognito -> verify it loads (Reveal view).
6. Click "Veto" on Reveal -> verify Plan B shows.
7. In Admin, Mark Done -> verify Bingo board updates.

## Sensitive Data Handling
- Tokens: never log raw tokens. Store only hashes in the DB.
- Passwords: store only Argon2 hashes. Never log raw passwords.
- API keys: `GEMINI_API_KEY` stays on the server. Never expose to client.

## Environment Variables
- `DATABASE_URL` (SQLite file path, used by Prisma).
- `SESSION_SECRET` (required for sessions).
- `GEMINI_API_KEY` (server-only AI calls).
- `RATE_LIMIT_GLOBAL_PER_MIN`, `RATE_LIMIT_RECEIVER_PER_MIN`, `RATE_LIMIT_AI_PER_MIN`.
- `CLIENT_URL` (CORS origin, defaults to `http://localhost:3000`).
- `UPLOAD_DIR` (default `data/uploads`).
- `USE_HTTPS` and `NODE_ENV` control secure cookies.

## Code Style Guidelines (General)
- Use ES modules (`import`/`export`), no `require`.
- Prefer 2-space indentation and line breaks around large objects/arrays.
- Most files use single quotes and semicolons; follow the surrounding file.
- Keep functions small and early-return on error cases.
- Avoid logging sensitive data (tokens, passwords, session ids, API keys).

## Imports and File Organization
- Import order: Node built-ins, third-party packages, then local modules.
- Keep a single blank line between import groups.
- Backend filenames use suffixes: `*.routes.js`, `*Controller.js`.
- React pages live in `client/src/pages` and use PascalCase filenames.

## Backend Conventions
- Controllers are async and wrap logic in `try/catch`; on error call `next(err)`.
- Return JSON with `res.status(...).json({ ... })` and early returns.
- Use the Prisma client from `server/src/utils/db.js` (single instance).
- Keep auth checks in middleware and assume session user id is available.
- Avoid exposing internal errors to clients; rely on `errorHandler`.

## Frontend Conventions
- Function components with React hooks (`useState`, `useEffect`).
- Prefer component-local helpers inside the same file (no heavy abstractions).
- Use Tailwind utility classes for styling; keep class names readable.
- Use the shared Axios instance from `client/src/api.js`.
- Keep strings user-facing and consistent with existing UI tone.

## API and Routing Conventions
- API base path is `/api`; client uses `api` with `withCredentials` enabled.
- Receiver flows use `/r?token=...` in the client and `/api/receiver` routes on the server.
- Multipart form uploads are used for idea images (`/api/ideas`).
- Keep payloads small and return only what the client needs.

## Database and Prisma
- Schema lives in `server/prisma/schema.prisma`.
- Migrations are generated under `server/prisma/migrations`.
- Use `npx prisma generate` after schema changes.
- Use `prisma:migrate` for deploys, `prisma migrate dev` for local.
- Keep Prisma calls in controllers/services; reuse `prisma` singleton.

## Session and Auth
- Session cookie name is `datebingo_sid` (see `server/src/index.js`).
- `req.session.userId` is the authenticated user id for admin routes.
- Auth checks should live in middleware; avoid repeating in controllers.

## File Uploads
- Uploads are stored in `UPLOAD_DIR` (default `data/uploads`).
- The server exposes `/uploads` as a static path.
- Validate file types and sizes when adding new upload features.

## AI Integration
- Gemini calls happen on the server only (`server/src/services/aiService.js`).
- Never send `GEMINI_API_KEY` or raw prompts to the client.
- Rate limit AI endpoints via `RATE_LIMIT_AI_PER_MIN`.

## Type System
- The codebase is plain JavaScript (no TypeScript).
- Avoid adding TS tooling unless requested; keep JS idioms consistent.

## Naming Conventions
- `camelCase` for variables, functions, and hooks.
- `PascalCase` for React components.
- `UPPER_SNAKE_CASE` for constants like configs and enums.
- Route names use kebab-like paths but keep file names in camelCase + suffix.

## Error Handling and Logging
- Server: log unexpected errors once in `errorHandler` only.
- Client: show concise alerts for API failures; avoid swallowing errors silently.
- Do not log request bodies that may include secrets or tokens.

## Deployment Notes
- Docker image serves both API and built client bundle on port 3000.
- Production static files are served from `client/dist`.
- Persistent data lives in `data/` when using Docker volumes.
- Avoid changing port mappings without updating `CLIENT_URL`.

## Cursor/Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.
