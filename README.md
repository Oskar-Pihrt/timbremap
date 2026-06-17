# Timbremap

A "sound compass" for music & audio gear — vote on where albums, songs, and gear sit on
two axes (**treble ↔ bass**, **technical ↔ atmospheric**), see the community average, and find
items that sound alike. See [CLAUDE.md](./CLAUDE.md) for the full product spec.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind 4** · **Supabase** (Postgres + Auth +
Storage) · **Deezer** for album metadata (no API key needed).

---

## What's built

- **Albums & songs** — Deezer search/import. Toggle the search box between Albums, Songs, and Gear.
- **User-submitted gear** — headphones / IEMs / speakers, with a pasted product-image URL and an
  optional price. Submit via the **Gear** tab or `/submit-gear`; new gear is **pending** and hidden
  until an admin approves it (see "Admin & moderation"). The creator (or an admin) can edit/delete
  gear from the item page.
- Every item lives at `/<type>/<slug>` (e.g. `/album/...`, `/song/...`, `/headphones/...`).
- Interactive compass: place/move your vote, **Average** vs **All votes** toggle.
- **Reviews** on every item — one editable text review per user (no reactions/comments).
- **Price** on gear (USD), shown on the page and in `Product` JSON-LD.
- Email/password auth (register / login / logout) + **My Votes** page.
- **Admin moderation** — admins approve/reject pending gear at `/admin` and can edit/delete any
  gear and delete any review.
- Recommendations (nearest items per category by Euclidean distance).
- SEO: SSR pages, per-page metadata, Open Graph/Twitter, type-aware JSON-LD
  (`MusicAlbum` / `MusicRecording` / `Product`), `sitemap.xml`, `robots.txt`, canonical tags.

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

## Admin & moderation

New gear submissions are inserted with `status='pending'` and stay hidden (not in browse, search,
recommendations, or sitemap) until an **admin** approves them. Admins also see Edit/Delete on any
gear and Delete on any review, and an **Admin** link in the nav to the `/admin` queue.

An admin is a `profiles` row with `is_admin = true`. The `/admin` page has two sections:
- **Moderation queue** — pending gear with Approve / Reject.
- **Users** — every account, with grant/revoke-admin and delete buttons (you can't change or
  delete your own admin status, to avoid lockout).

**Granting admin** — easiest once you already have one admin: open `/admin` → Users → **Make
admin**. To create the *first* admin (no admin exists yet), set the flag directly. The bootstrap
migration already does this for `oskar.smotex@gmail.com` **if** that account exists when migrations
run; otherwise, in Supabase Studio's SQL editor (http://localhost:54323) or `psql`:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

Then reload the app — the **Admin** link appears.

---

## Project layout

```
src/
  app/
    page.tsx                 Home (sidebar + intro)
    [type]/[slug]/page.tsx   SSR item page for all types (metadata, JSON-LD, compass, recs, reviews)
    [type]/[slug]/edit/      Auth-only edit page (creator or admin) for gear
    submit-gear/page.tsx     Auth-only gear submission form
    admin/page.tsx           Admin-only gear moderation queue
    my-votes/page.tsx        Auth-only list of the user's votes
    login/, register/        Auth pages
    api/search/route.ts      Search (Deezer albums/songs via ?type=, local gear)
    actions/                 Server actions (auth.ts, vote.ts, gear.ts, review.ts, admin.ts)
    sitemap.ts, robots.ts    SEO routes
  components/                Compass, Sidebar, SearchPanel, GearForm, Reviews, AuthControls, AppShell, AuthForm
  lib/
    supabase/                Browser / server / admin clients + session proxy
    deezer.ts                Deezer API wrapper (albums + tracks) + slugify
    items.ts                 DB queries, Deezer import (album/song), gear create + search
    compass.ts               Coordinate math + placement-to-words
    types.ts
  proxy.ts                   Session refresh (Next 16 "proxy", formerly "middleware")
supabase/
  config.toml                Local stack config
  migrations/                SQL schema (items, votes, profiles, RLS, item_stats, nearby_items,
                             gear-images storage bucket)
```

---

## Deploying to timbremap.com (your accounts)

Production = **hosted Supabase** (DB/Auth) + **Vercel** (Next.js) + the **timbremap.com** domain
(registered at Namecheap).

### 1. Hosted Supabase
- Create a free project at https://supabase.com (pick a region near your users; save the DB
  password).
- Apply all migrations from this repo:
  ```bash
  supabase link --project-ref <your-project-ref>   # ref is in the project URL/General settings
  supabase db push                                  # applies supabase/migrations/* (incl. admin/moderation)
  ```
- **Auth settings** (Dashboard → Authentication → URL Configuration):
  - **Site URL:** `https://timbremap.com`
  - **Redirect URLs:** add `https://timbremap.com/**`
  - Email confirmation: hosted Supabase **requires confirming the email** (the local stack
    auto-confirms). Either configure SMTP (Authentication → Emails) so confirmation mails send, or
    disable "Confirm email" while testing.

### 2. Vercel
- Import this repo as a new project at https://vercel.com (framework auto-detected: Next.js).
- Set **Environment Variables** (Project → Settings → Environment Variables), from your hosted
  Supabase values:
  - `NEXT_PUBLIC_SUPABASE_URL` — `https://<ref>.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the project's anon/publishable key
  - `SUPABASE_SERVICE_ROLE_KEY` — the project's service-role key (**server-only secret**)
  - `NEXT_PUBLIC_SITE_URL` — `https://timbremap.com`
  - `LASTFM_API_KEY` — optional (granular genres)
- Deploy.

### 3. Domain (Namecheap → Vercel)
- In Vercel: Project → Settings → **Domains** → add `timbremap.com` (and `www.timbremap.com`).
- Vercel shows the DNS records to set. In Namecheap (Domain List → Manage → **Advanced DNS**),
  set the records Vercel lists — typically:
  - `A` record, host `@` → `76.76.21.21`
  - `CNAME` record, host `www` → `cname.vercel-dns.com`
  - (Remove Namecheap's default "parking" records.)
- DNS propagates in minutes-to-an-hour; HTTPS is issued automatically by Vercel.

### 4. First admin in production
The bootstrap migration only flips `oskar.smotex@gmail.com` to admin **if that account already
exists** when migrations run — on a fresh prod DB it won't. So: register your account on the live
site, then in the Supabase Dashboard SQL editor run:
```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```
After that you can grant admin to others from `/admin` → Users.

### 5. Smoke-test
Import an album, submit a piece of gear (it should land **pending** and be hidden), approve it from
`/admin`, and confirm canonical/OG tags use `https://timbremap.com`.

> `next.config.ts` allows any image host, so Deezer covers and pasted gear-image links render
> without further config.
