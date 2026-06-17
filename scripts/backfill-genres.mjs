// Backfill granular Last.fm genres onto existing album/song items.
// Usage: node scripts/backfill-genres.mjs   (reads .env.local)
//
// Requires LASTFM_API_KEY and SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL.
// Idempotent: re-fetches tags and overwrites genres when Last.fm returns matches.

import { readFileSync } from "node:fs";

// --- load .env.local (simple parser) ---------------------------------------
const env = {};
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
} catch {}
const KEY = process.env.LASTFM_API_KEY || env.LASTFM_API_KEY;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error("LASTFM_API_KEY is not set in .env.local — get one at https://www.last.fm/api");
  process.exit(1);
}

// Keep this list in sync with src/lib/lastfm.ts GENRE_ALLOWLIST.
const ALLOW = [
  "Rock","Classic Rock","Progressive Rock","Psychedelic Rock","Art Rock","Hard Rock","Soft Rock",
  "Folk Rock","Blues Rock","Garage Rock","Indie Rock","Alternative Rock","Post-Rock","Math Rock",
  "Krautrock","Glam Rock","Surf Rock","Southern Rock","Space Rock","Stoner Rock","Punk","Punk Rock",
  "Post-Punk","Pop Punk","Hardcore Punk","Proto-Punk","Post-Hardcore","Grunge","Alternative",
  "Shoegaze","Noise Rock","Slacker Rock","Metal","Heavy Metal","Thrash Metal","Death Metal",
  "Black Metal","Doom Metal","Power Metal","Progressive Metal","Nu Metal","Metalcore","Sludge Metal",
  "Speed Metal","Symphonic Metal","Pop","Synth-pop","Indie Pop","Dream Pop","Power Pop","Art Pop",
  "Electropop","Dance-pop","Baroque Pop","Hyperpop","Electronic","Electro","House","Techno","Trance",
  "Drum and Bass","Dubstep","Ambient","IDM","Synthwave","Downtempo","Trip-hop","Breakbeat","Garage",
  "EDM","Industrial","Darkwave","New Wave","Hip-Hop","Rap","Trap","Boom Bap","Conscious Hip-Hop",
  "R&B","Soul","Neo-Soul","Funk","Disco","Jazz","Jazz Fusion","Bebop","Smooth Jazz","Swing","Blues",
  "Classical","Baroque","Opera","Folk","Singer-Songwriter","Country","Americana","Bluegrass","Reggae",
  "Ska","Dub","Dancehall","Afrobeat","Latin","Salsa","Bossa Nova","Experimental","Lo-fi","Acoustic",
  "Instrumental","Soundtrack",
];
const DISPLAY = new Map(ALLOW.map((g) => [g.toLowerCase(), g]));

async function topTags(params) {
  const qs = new URLSearchParams({ ...params, api_key: KEY, format: "json", autocorrect: "1" });
  const r = await fetch(`https://ws.audioscrobbler.com/2.0/?${qs}`);
  if (!r.ok) return [];
  const j = await r.json();
  const tag = j?.toptags?.tag;
  return Array.isArray(tag) ? tag : tag ? [tag] : [];
}
function pick(tags, max = 4) {
  const out = [];
  for (const t of tags) {
    const d = t?.name ? DISPLAY.get(t.name.trim().toLowerCase()) : null;
    if (d && !out.includes(d)) { out.push(d); if (out.length >= max) break; }
  }
  return out;
}

const H = { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" };
const items = await (await fetch(
  `${SUPA_URL}/rest/v1/items?select=id,type,title,artist,album&type=in.(album,song)`,
  { headers: H },
)).json();
console.log(`${items.length} music items`);

for (const it of items) {
  let genres = [];
  if (it.type === "album") {
    genres = pick(await topTags({ method: "album.gettoptags", artist: it.artist ?? "", album: it.title }));
  } else {
    genres = pick(await topTags({ method: "track.gettoptags", artist: it.artist ?? "", track: it.title }));
    if (!genres.length && it.album)
      genres = pick(await topTags({ method: "album.gettoptags", artist: it.artist ?? "", album: it.album }));
  }
  if (genres.length) {
    const u = await fetch(`${SUPA_URL}/rest/v1/items?id=eq.${it.id}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ genres }),
    });
    console.log(`${it.title} -> [${genres.join(", ")}] (${u.status})`);
  } else {
    console.log(`${it.title} -> no matching tags`);
  }
}
