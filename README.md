# MusicCompas

A "sound compass" for music & audio gear — vote on where albums (and later songs/gear) sit on
two axes (**treble ↔ bass**, **technical ↔ atmospheric**), see the community average, and find
items that sound alike. See [CLAUDE.md](./CLAUDE.md) for the full product spec.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind 4** · **Supabase** (Postgres + Auth +
Storage) · **Deezer** for album metadata (no API key needed).

---

## What's built (MVP)

- Album search (Deezer) → import → SEO-friendly album page at `/album/<slug>`.
- Interactive compass: place/move your vote, **Average** vs **All votes** toggle.
- Email/password auth (register / login / logout) + **My Votes** page.
- Recommendations (nearest items per category by Euclidean distance).
- SEO: SSR pages, per-page metadata, Open Graph/Twitter, JSON-LD (`MusicAlbum`),
  `sitemap.xml`, `robots.txt`, canonical tags.

---

## Prerequisites you need to install (one-time)

The app needs a local Supabase stack, which runs in Docker.

1. **Docker** — install Docker Desktop (macOS/Windows) or Docker Engine (Linux) and make sure
   the daemon is running (`docker info` should succeed).
2. **Supabase CLI** — https://supabase.com/docs/guides/local-development/cli/getting-started
   - Linux/macOS (Homebrew): `brew install supabase/tap/supabase`
   - Or via npm: `npm install -g supabase` (or use `npx supabase ...` without installing).
   - Verify: `supabase --version`

---

## Running locally

```bash
# 1. Start the local Supabase stack (first run downloads Docker images — a few minutes).
#    This applies the migrations in supabase/migrations automatically.
supabase start

# 2. Confirm your keys match .env.local.
#    `supabase start` prints "API URL", "anon key", and "service_role key".
#    The defaults in .env.local are the standard CLI dev values; if yours differ, paste them in.

# 3. Run the app.
npm run dev
```

Open http://localhost:3000, search for an album, register an account, and click on the compass
to place a vote.

Useful local URLs:
- App: http://localhost:3000
- Supabase Studio (DB browser): http://localhost:54323
- Local email inbox (signup/confirm mails): http://localhost:54324

Reset the database (re-run all migrations from scratch):

```bash
supabase db reset
```

---

## Project layout

```
src/
  app/
    page.tsx                 Home (sidebar + intro)
    album/[slug]/page.tsx    SSR album page (metadata, JSON-LD, compass, recommendations)
    my-votes/page.tsx        Auth-only list of the user's votes
    login/, register/        Auth pages
    api/search/route.ts      Deezer album search
    actions/                 Server actions (auth.ts, vote.ts)
    sitemap.ts, robots.ts    SEO routes
  components/                Compass, Sidebar, SearchPanel, AuthControls, AppShell, AuthForm
  lib/
    supabase/                Browser / server / admin clients + session proxy
    deezer.ts                Deezer API wrapper + slugify
    items.ts                 DB queries + album import
    compass.ts               Coordinate math + placement-to-words
    types.ts
  proxy.ts                   Session refresh (Next 16 "proxy", formerly "middleware")
supabase/
  config.toml                Local stack config
  migrations/                SQL schema (items, votes, profiles, RLS, item_stats, nearby_items)
```

---

## Deploying later (your accounts)

1. Create a free **Supabase** project; run `supabase link` + `supabase db push` to apply
   migrations to it.
2. Create a **Vercel** project from this repo.
3. Set env vars on Vercel from `.env.local.example`, using your hosted Supabase URL/keys and
   your production `NEXT_PUBLIC_SITE_URL`.
