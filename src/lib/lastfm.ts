import "server-only";

const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";

/**
 * Curated genre/subgenre allowlist. Last.fm tags are a noisy folksonomy
 * ("favorites", "seen live", "00s", …), so we only keep tags that match a real
 * genre. The canonical display string here is what gets stored/shown; matching
 * is case-insensitive on its lowercased form.
 */
const GENRE_ALLOWLIST = [
  // Rock & subgenres
  "Rock", "Classic Rock", "Progressive Rock", "Psychedelic Rock", "Art Rock",
  "Hard Rock", "Soft Rock", "Folk Rock", "Blues Rock", "Garage Rock",
  "Indie Rock", "Alternative Rock", "Post-Rock", "Math Rock", "Krautrock",
  "Glam Rock", "Surf Rock", "Southern Rock", "Space Rock", "Stoner Rock",
  // Punk
  "Punk", "Punk Rock", "Post-Punk", "Pop Punk", "Hardcore Punk", "Proto-Punk",
  "Post-Hardcore",
  // Grunge / alt
  "Grunge", "Alternative", "Shoegaze", "Noise Rock", "Slacker Rock",
  // Metal
  "Metal", "Heavy Metal", "Thrash Metal", "Death Metal", "Black Metal",
  "Doom Metal", "Power Metal", "Progressive Metal", "Nu Metal",
  "Metalcore", "Sludge Metal", "Speed Metal", "Symphonic Metal",
  // Pop
  "Pop", "Synth-pop", "Indie Pop", "Dream Pop", "Power Pop", "Art Pop",
  "Electropop", "Dance-pop", "Baroque Pop", "Hyperpop",
  // Electronic
  "Electronic", "Electro", "House", "Techno", "Trance", "Drum and Bass",
  "Dubstep", "Ambient", "IDM", "Synthwave", "Downtempo", "Trip-hop",
  "Breakbeat", "Garage", "EDM", "Industrial", "Darkwave", "New Wave",
  // Hip hop / R&B / soul
  "Hip-Hop", "Rap", "Trap", "Boom Bap", "Conscious Hip-Hop",
  "R&B", "Soul", "Neo-Soul", "Funk", "Disco",
  // Jazz / blues / classical / folk
  "Jazz", "Jazz Fusion", "Bebop", "Smooth Jazz", "Swing",
  "Blues", "Classical", "Baroque", "Opera", "Folk", "Singer-Songwriter",
  "Country", "Americana", "Bluegrass",
  // World / reggae / latin
  "Reggae", "Ska", "Dub", "Dancehall", "Afrobeat", "Latin", "Salsa", "Bossa Nova",
  // Other broad
  "Experimental", "Lo-fi", "Acoustic", "Instrumental", "Soundtrack",
];

const DISPLAY_BY_LOWER = new Map(GENRE_ALLOWLIST.map((g) => [g.toLowerCase(), g]));

interface LastfmTag {
  name?: string;
  count?: number;
}

function apiKey(): string | null {
  return process.env.LASTFM_API_KEY || null;
}

/** Filter raw Last.fm tags down to canonical allowlisted genres (most-used first). */
function pickGenres(tags: LastfmTag[], max = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  // Last.fm returns tags already ordered by popularity; keep that order.
  for (const t of tags) {
    const display = t.name ? DISPLAY_BY_LOWER.get(t.name.trim().toLowerCase()) : undefined;
    if (display && !seen.has(display)) {
      seen.add(display);
      out.push(display);
      if (out.length >= max) break;
    }
  }
  return out;
}

async function topTags(params: Record<string, string>): Promise<LastfmTag[]> {
  const key = apiKey();
  if (!key) return [];
  const qs = new URLSearchParams({ ...params, api_key: key, format: "json", autocorrect: "1" });
  try {
    const res = await fetch(`${LASTFM_API}?${qs.toString()}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { toptags?: { tag?: LastfmTag | LastfmTag[] } };
    const tag = json.toptags?.tag;
    return Array.isArray(tag) ? tag : tag ? [tag] : [];
  } catch {
    return [];
  }
}

/** Granular genres for an album from Last.fm top tags. Empty if no key/match. */
export async function albumGenres(artist: string | null, album: string): Promise<string[]> {
  if (!artist) return [];
  return pickGenres(await topTags({ method: "album.gettoptags", artist, album }));
}

/**
 * Granular genres for a track. Falls back to the album's tags when the track
 * itself has none.
 */
export async function trackGenres(
  artist: string | null,
  track: string,
  album: string | null,
): Promise<string[]> {
  if (!artist) return [];
  const fromTrack = pickGenres(await topTags({ method: "track.gettoptags", artist, track }));
  if (fromTrack.length > 0) return fromTrack;
  return album ? albumGenres(artist, album) : [];
}
