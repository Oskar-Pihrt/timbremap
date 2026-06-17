# MusicCompas — Project Guide

> This file is the source of truth for the MusicCompas project. It is written both as a
> product spec and as guidance for **Claude Code instances** working on this repo. Read it
> fully before making changes. Keep it up to date as decisions are made.

---

## 1. What This Project Is

MusicCompas is a web app for placing music and audio gear on a two-axis "sound compass" —
think of a political compass, but for how something *sounds*. Registered users vote on where
an album, song, or piece of audio gear sits on the map, the app builds a community average,
and uses it to recommend other items that sit nearby.

### The Compass

```
                  Treble
                    │
                    │
   Technical ───────┼─────── Atmospheric
                    │
                    │
                   Bass
```

- **Vertical axis** — **Treble** (top) ↔ **Bass** (bottom)
- **Horizontal axis** — **Technical** (left) ↔ **Atmospheric** (right)

Every vote is a single point (X, Y) on this square. The cover art of the album/song — or the
product image for gear — is shown as the **background** of the compass, and placements are
drawn as **dots** on top of it.

### What Can Be Placed (collectively "objects" / "items")

- **Albums**
- **Songs**
- **Headphones**
- **IEMs**
- **Speakers**

### Voting

Any **registered user** can place a dot. For each item the app shows:

- **Average view** — a single dot at the mean of all votes (the consensus placement).
- **All votes view** — every individual vote drawn as a dot (spread / heat map of opinion).

A toggle switches between the two. Users can **add** or **change** their vote at any time.

### Recommendations

For any selected item, recommend the items closest to it on the compass — surfaced per
category (best matching song / album / headphones / IEM / speaker).

---

## 2. UI Layout

Two main areas (see the original sketch in project notes):

### Left column — Search & navigation
1. **Search** box at the top.
2. **Results list** — items matching the search. When nothing is searched, show the
   **most-voted objects**.
3. Selecting a result opens its **detail** here.
4. Account controls: **Login / Logout / Register** and **My Votes** (every item the user voted on).

### Right area — The Compass
A large square showing the selected item's cover/product image as the background, with vote
dots overlaid (average dot or all individual votes depending on the toggle).

### Item Detail
Type-specific metadata plus vote controls:
- **Product** (headphones / IEM / speaker): image, **manufacturer**, **release date**.
- **Song**: cover image, **artist**, **album**, **release date**.
- **Album**: cover image, **artist**, **release date**, representative song.

Every item detail also has: the **average / all-votes toggle**, **add / change my vote**
controls, and **recommendations** (best matching song, album, headphones, IEM, speaker).

### Accounts
- Visitors can browse and view compasses (public).
- Registering / logging in unlocks **voting** and the **My Votes** list.

---

## 3. Tech Stack (decided)

```
Next.js (React) on Vercel  →  Supabase (Postgres + Auth + Storage)
        frontend + API              database, users, images
```

- **Framework: Next.js (React).** Chosen for SSR/ISR (critical for SEO — see §5) and because
  it bundles frontend + lightweight API routes in one deployable project. React suits the
  interactive compass canvas and toggle views.
- **Backend/DB: Supabase.** Managed Postgres + built-in **Auth** (handles login/register/logout)
  + **Storage** (images) + auto-generated REST API. Removes most custom backend work.
- **Hosting frontend: Vercel** (free tier, first-class Next.js support).

### Hosting notes / rejected options
- **GitHub Pages is NOT usable for the app** — it serves static files only, no backend or DB.
  (Could host a purely static landing page, but not the app.)
- **Raw VPS (e.g. Oracle Cloud Always Free) was rejected for now** — too much ops overhead
  (Linux/nginx/backups) for this stage. Revisit only if full control is needed later.
- Alternatives considered: Neon (Postgres only), Railway/Render (DB + backend), SvelteKit or
  Vite+React (lighter frontends). Stack above is the default unless changed here.

---

## 4. Item Image & Metadata Sources

Different sources per item type:

### Music (albums, songs, artists, covers, release dates)
- **Spotify Web API** ⭐ — covers, artist, album, release date, popularity. Free, requires
  app registration. Preferred for music.
- **Deezer API** — simple, free, good cover art, no auth needed for search. Good fallback.
- **MusicBrainz + Cover Art Archive** — fully open, no auth, but messier data.
- **Last.fm API** — good metadata, free.

### Audio gear (headphones, IEMs, speakers)
- **No clean free API exists.** Plan:
  - **User-submitted gear** (manufacturer, model, image, release date) with moderation —
    fits the community model. This is the default approach.
  - Optionally seed/scrape from ASR, Crinacle's database, or Head-Fi (check terms first).

**Practical rule:** auto-fetch music from Spotify/Deezer; allow user-submitted gear since no
good gear API exists.

---

## 5. SEO (important — design for it from the start)

Every item (album/song/gear) is a page that should rank on Google. This **only works if the
content is server-rendered** — a plain client-side React SPA ships near-empty HTML and ranks
poorly. This is a primary reason Next.js was chosen.

### Requirements / checklist
| Item | What to do |
|------|-----------|
| **Server rendering** | Use Next.js SSR/SSG/**ISR** for all item pages. ISR = static page per item, periodically refreshed as votes change. The big win. |
| **Clean URLs** | `/album/dark-side-of-the-moon`, not `/?id=123`. Use slugs. |
| **Per-page titles/descriptions** | e.g. "Dark Side of the Moon — Sound Compass & Reviews \| MusicCompas". |
| **Open Graph / Twitter cards** | So shared links show cover + compass. |
| **Structured data (JSON-LD)** | `MusicAlbum`, `Product`, and **`AggregateRating`** (maps perfectly to vote averages) → rich results. |
| **Sitemap.xml** | Auto-generate, listing every item. |
| **robots.txt** | Allow crawling; block private pages like `/my-votes`. |
| **Image alt text** | Descriptive alt on cover/product images. |
| **Canonical tags** | Avoid duplicate-content issues. |

### Nuance — the interactive compass
The canvas dots are client-side JS and Google won't "see" them; that's fine. Make sure the
**text content** (artist, album, release date, **average placement described in words**,
recommendations as links) is in the server-rendered HTML. Render the average placement as text
too (e.g. "Community placement: slightly bassy, atmospheric") — good for SEO *and*
accessibility.

---

## 6. Data Model (BUILT — see `supabase/migrations/`)

Implemented in Postgres via the Supabase CLI. Schema lives in
`supabase/migrations/20260617000000_init.sql`.

- **profiles** — `id` (FK `auth.users`), `display_name`, `created_at`. Auto-created on signup
  via the `handle_new_user` trigger. Auth itself is handled by Supabase Auth.
- **items** — `id`, `type` (`album|song|headphones|iem|speaker` enum), `slug` (unique), `title`,
  `artist`, `album`, `manufacturer`, `image_url`, `release_date`, `external_source` (`deezer`),
  `external_id`, `created_by`, `status` (`active|pending|rejected`), timestamps.
  Unique on (`external_source`, `external_id`).
- **votes** — `id`, `user_id`, `item_id`, `x`, `y` (doubles, **CHECK in [-1, 1]**), timestamps.
  **Unique (user_id, item_id)** — re-voting upserts the same row.
- **item_stats** (view) — per item: `vote_count`, `avg_x`, `avg_y`. This is the **average
  placement**, computed on the fly.
- **nearby_items(target, type, limit)** (function) — recommendations: nearest items of a type by
  Euclidean distance on the average placement.
- **RLS**: items/votes/profiles are world-readable; a user may only write their own votes/profile.
  Deezer imports are written server-side with the service-role key (`src/lib/items.ts`).

### Decided conventions (defaults — change here if revisited)
- **Coordinates:** `x` = Technical(−1) ↔ Atmospheric(+1), `y` = Bass(−1) ↔ Treble(+1), floats in `[-1, 1]`.
- **Average placement:** mean (not median/density).
- **Recommendations:** Euclidean nearest by category, top 3.
- **JSON-LD:** album pages emit `MusicAlbum` + a vote `InteractionCounter`. **`AggregateRating`
  was intentionally NOT used** — the compass is a 2-axis placement, not a 1–5 quality score, so a
  synthetic rating would be invalid structured data. Revisit if a real rating dimension is added.

---

## 7. Guidance for Claude Instances

- **This file is the spec.** When the user makes a new decision (stack, schema, source, naming),
  **update the relevant section here** so it stays the single source of truth. Note rejected
  options and *why*, like §3 does.
- **Nothing is built yet** as of this writing — the repo is at concept/planning stage. Don't
  assume code exists; check first.
- **Working directory:** `/home/osuku/Work/MusicCompas` (not a git repo at time of writing).
- **Default decisions already made:** Next.js + Supabase + Vercel; Spotify/Deezer for music
  metadata; user-submitted gear; SEO via SSR/ISR. Don't re-litigate these unless asked — build
  on them.
- **Open decisions to raise with the user when relevant:** averaging method (mean vs median vs
  density), exact vote coordinate range, gear moderation flow, recommendation algorithm details.
- **SEO is a first-class requirement**, not an afterthought — keep item pages server-rendered
  and keep meaningful text in the HTML.
- Keep product terminology consistent: *object/item*, *vote/placement*, *average placement*,
  *compass*, *recommendation* (see glossary below).

### Glossary
| Term | Meaning |
|------|---------|
| **Object / Item** | An album, song, or piece of gear placeable on the compass. |
| **Vote / Placement** | A single user's (X, Y) point for one item. |
| **Average placement** | The mean of all votes for an item. |
| **Compass** | The treble/bass × technical/atmospheric square. |
| **Recommendation** | Another item near the selected one on the compass. |

---

## 8. Status

**MVP built (albums end-to-end).** Next.js 16 (App Router) + TS + Tailwind 4, Supabase (local
via the CLI/Docker stack), Deezer for album metadata. Implemented: album search/import,
interactive compass with voting + average/all-votes toggle, email/password auth, My Votes,
recommendations, and full SEO (SSR, metadata, OG, JSON-LD, sitemap, robots). See `README.md`
for how to run it.

**Notable implementation facts for future Claude instances:**
- Next.js 16 specifics: `params`/`searchParams` and `cookies()`/`headers()` are **async**; the
  request hook is `src/proxy.ts` (the old `middleware.ts` convention is deprecated).
- Music source is currently **Deezer only** (no auth). Spotify is not wired yet.
- Gear types (`headphones|iem|speaker`) and `song` exist in the schema and recommendation UI but
  have **no import/submission flow yet** — that's the next extension. Recommendation cards
  currently link to `/album/<slug>` for every type; add per-type routes when those ship.

### Next steps (not built)
- Songs (Deezer track search/import) + a `/song/[slug]` route.
- User-submitted gear with moderation (`status` field already supports it).
- Hosted Supabase + Vercel deploy (see README "Deploying later").
