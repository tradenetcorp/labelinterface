# labelapp — Agent Notes

## What this repo is
Labeling web app for reviewing/editing speech transcripts alongside audio.

## Tech stack
- React Router v7 + Vite (TypeScript, ESM) (`app/`, `react-router.config.ts`, `vite.config.ts`)
- Tailwind CSS (+ some shadcn usage in UI)
- Prisma + PostgreSQL (Docker) (`prisma/schema.prisma`)
- Auth: email OTP + cookie sessions (plus optional admin/password login)
- Storage: local filesystem or S3/LocalStack for transcript assets

## Key product flows
- Auth:
  - Email OTP login at `/login` → `/verify`
  - Admin/password login at `/login-password`
  - Session creation/validation lives in `app/lib/session.server.ts` and `app/lib/auth.server.ts`
  - Email sending via `app/lib/email.server.ts`; if SMTP isn’t configured, OTPs may be logged in dev
- Admin:
  - Users: `/admin/users`
  - Logs: `/admin/logs`
  - Import: `/admin/import`
- Transcript labeling:
  - UI route: `/` (`app/routes/home.tsx`)
  - API routes under `app/routes/api/` (e.g. transcript fetch/import)

## Repo layout (high-signal)
- `app/`
  - `routes.ts`: route table (React Router v7)
  - `routes/`: UI + server loaders/actions (auth, admin, transcript workflows)
  - `lib/`: server utilities (auth/session/OTP/email, Prisma client, storage abstraction)
  - `components/`: shared UI components
- `prisma/`
  - `schema.prisma`: `User`, `Session`, `LoginCode`, `ActivityLog`, `Transcript`
  - `migrations/`: Prisma migrations
  - `seed.ts`: seeds initial admin user
- `scripts/`: Python ASR/diarization utilities (managed with `uv`)

## Local development
1) Install JS deps: `npm install`
2) Create `.env` from `.env.example`
3) DB setup:
   - `docker compose up -d postgres`
   - `npx prisma migrate dev`
   - `npx prisma db seed`
4) Run dev server: `npm run dev` (usually on `http://localhost:5173`)

Helpful commands:
- Typecheck: `npm run typecheck`
- Production build: `npm run build`
- Serve build: `npm start`
- Prisma Studio: `npx prisma studio`

## Environment variables (see `.env.example`)
- DB/session: `DATABASE_URL`, `SESSION_SECRET`
- Email OTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Admin seed: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Storage:
  - `STORAGE_TYPE`: `local` | `s3` | `localstack`
  - S3: `AWS_REGION`, `AWS_S3_BUCKET`, optional `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
  - LocalStack: `AWS_ENDPOINT_URL`
  - Local files: `LOCAL_TRANSCRIPTS_PATH`
  - Import helpers: `TRANSCRIPTS_BASE_PATH`, `TRANSCRIPTS_JSONL_KEY`

Storage code lives in `app/lib/storage.server.ts`:
- `local`: serves from `public/` path (no presigning)
- `s3`/`localstack`: generates presigned URLs for audio/text objects

## Working conventions for agents
- Prefer small, targeted diffs; keep UI changes in `app/` and DB changes in `prisma/`.
- When changing the DB schema, also add a migration and update `prisma/seed.ts` if needed.
- Keep secrets out of git: never commit real `.env` values or credentials.
- Validate changes with `npm run typecheck` (and `npm run build` if touching router/server code).

## Python scripts (`scripts/`)
- Setup: `cd scripts && uv sync`
- Run: `uv run python asr_scripts/<script>.py`
- Some scripts require `HF_TOKEN` (Hugging Face) and/or extra ASR deps.
