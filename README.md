# Gym CRM — First Draft

Minimal CRM: CRUD for gym members. Built to be low-maintenance and cheap to
run for years, using entirely managed services (no servers to patch).

## Stack

- **Next.js 14** (App Router, TypeScript) — one codebase for UI + backend
- **Prisma** — type-safe database access and migrations
- **PostgreSQL** — hosted on a managed provider (Supabase or Neon both have
  free tiers that comfortably cover ~4k members / a few new rows per day)
- **Tailwind CSS** — styling
- **Vercel** — hosting (free/hobby tier is enough for this scale)

This combination is intentionally "boring": all pieces are mainstream,
long-lived, and hosted by their vendors, so there's no OS patching, no
server to reboot, and backups/HTTPS/scaling are handled for you.

## 1. Install prerequisites

- Install [Node.js LTS](https://nodejs.org) (20.x or later)
- Create a free Postgres database at either:
  - [Supabase](https://supabase.com) (Project Settings → Database →
    Connection string → URI, use the "Transaction" pooler string), or
  - [Neon](https://neon.tech) (Dashboard → Connection Details)

## 2. Configure environment

Copy `.env.example` to `.env` and paste your connection string:

```bash
cp .env.example .env
```

## 3. Install dependencies and set up the database

```bash
npm install
npx prisma migrate dev --name init
```

This creates the `Member` table in your database.

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — you'll see the dashboard, and `/members` for
the member list with Add / Edit / Delete.

## 5. Deploy

1. Push this project to a GitHub repository.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the `DATABASE_URL` environment variable in the Vercel project
   settings (same value as your `.env`).
4. Deploy. Vercel builds and hosts the app; Supabase/Neon hosts the data.

## What's here (v1 scope)

- `Member` model: name, phone, email, membership status, join date, notes
- Full CRUD: list + search, add, edit, delete
- Basic dashboard with member counts by status

## Deliberately not included yet

No authentication/login, no staff roles, no payments/billing, no
attendance or class scheduling — tell me which of these to add next and
we'll layer it on.
