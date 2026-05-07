# Sentinel Notes

Secure note-taking web application for Information Assurance and Security final project.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Zod validation

## Features

- Login + Signup with Supabase Auth
- Generic auth errors (`Invalid credentials`)
- Account lockout after 5 failed attempts for 5 minutes
- HTTP-only, Secure cookies with 7-day expiry
- Password strength meter
- Notes CRUD with Trash folder
- Dashboard activity feed (`SUCCESS`, `FAILED`, `LOCKED`)
- Profile update and password change
- WebGoat lesson link section in dashboard

## Setup

1. Copy `.env.example` to `.env.local` and set your Supabase values.
2. Run SQL migration from `supabase/migrations/20260507_init.sql` in Supabase SQL editor.
3. Install and run:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.

## Security Notes

- Passwords are never stored in plain text; Supabase Auth handles secure password hashing.
- Server-side Zod validation sanitizes and validates incoming payloads.
- Supabase/PostgREST uses parameterized queries by default.
- Activity logging and lockout reduce brute-force and credential-stuffing risk.
