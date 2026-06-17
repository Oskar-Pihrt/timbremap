import type { SearchResult } from "@/lib/types";

const DEEZER_API = "https://api.deezer.com";

interface DeezerArtist {
  name?: string;
}
interface DeezerAlbumSearch {
  id: number;
  title: string;
  cover_xl?: string;
  cover_big?: string;
  cover_medium?: string;
  artist?: DeezerArtist;
}
interface DeezerGenres {
  data?: { name?: string }[];
}
interface DeezerAlbumFull extends DeezerAlbumSearch {
  release_date?: string;
  genres?: DeezerGenres;
}

interface DeezerTrackAlbum {
  id?: number;
  title?: string;
  cover_xl?: string;
  cover_big?: string;
  cover_medium?: string;
}
interface DeezerTrack {
  id: number;
  title: string;
  artist?: DeezerArtist;
  album?: DeezerTrackAlbum;
  release_date?: string;
}

function bestCover(a: {
  cover_xl?: string;
  cover_big?: string;
  cover_medium?: string;
}): string | null {
  return a.cover_xl || a.cover_big || a.cover_medium || null;
}

/** First named genre from a Deezer album's genre list, if any. */
function firstGenre(genres?: DeezerGenres): string | null {
  return genres?.data?.find((g) => g.name)?.name ?? null;
}

/** Titles that signal a compilation rather than a proper studio album. */
const COMPILATION_RE =
  /\b(greatest hits|best of|the very best|anthology|collection|essential|compilation|hits)\b/i;

/**
 * Normalize an album title for de-duplication: drop edition/version suffixes
 * like "(Deluxe Edition)", "[Remastered 2011]", "- Expanded", etc. so that the
 * different editions of one album collapse to a single key.
 */
function baseAlbumTitle(title: string): string {
  return title
    .replace(/[([{].*?[)\]}]/g, " ") // remove parenthesised/bracketed suffixes
    .replace(
      /\s*[-–—:]?\s*\b(deluxe|expanded|remaster(?:ed)?|special|anniversary|edition|version|bonus|reissue|mono|stereo|live|explicit|clean|super|collector'?s)\b.*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Search Deezer albums. No auth required.
 *
 * Merges two sources: the album-search endpoint and albums derived from the
 * track-search endpoint. The latter has broader coverage — some albums (often
 * Japanese / regional releases) are geo-limited in `/search/album` but still
 * surface via tracks — so it acts as a fallback for missing albums.
 */
export async function searchAlbums(query: string, limit = 12): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  // Over-fetch so we still have enough results after filtering/de-duping.
  const fetchLimit = Math.max(limit * 4, 40);
  const [albumRes, trackRes] = await Promise.all([
    fetch(`${DEEZER_API}/search/album?q=${encodeURIComponent(q)}&limit=${fetchLimit}`, {
      next: { revalidate: 60 * 60 },
    }),
    fetch(`${DEEZER_API}/search?q=${encodeURIComponent(q)}&limit=${fetchLimit}`, {
      next: { revalidate: 60 * 60 },
    }),
  ]);

  const albumData = albumRes.ok
    ? ((await albumRes.json()) as { data?: DeezerAlbumSearch[] }).data ?? []
    : [];
  const trackData = trackRes.ok
    ? ((await trackRes.json()) as { data?: DeezerTrack[] }).data ?? []
    : [];

  // Normalize both sources into album candidates. Album-search hits come first
  // so they win ties; albums pulled from tracks fill the gaps.
  const candidates: { id: number; title: string; artist?: DeezerArtist; cover: string | null }[] = [];
  for (const a of albumData) {
    candidates.push({ id: a.id, title: a.title, artist: a.artist, cover: bestCover(a) });
  }
  for (const t of trackData) {
    if (t.album?.id && t.album.title) {
      candidates.push({
        id: t.album.id,
        title: t.album.title,
        artist: t.artist,
        cover: bestCover(t.album),
      });
    }
  }

  const seen = new Set<string>();
  const seenIds = new Set<number>();
  const results: SearchResult[] = [];
  for (const a of candidates) {
    if (seenIds.has(a.id)) continue;
    seenIds.add(a.id);

    // Skip greatest-hits / best-of style compilations.
    if (COMPILATION_RE.test(a.title)) continue;

    // Collapse deluxe/expanded/remastered editions of the same album. Deezer
    // ranks by relevance, so the first edition we keep is the best match.
    const key = `${(a.artist?.name ?? "").toLowerCase()}::${baseAlbumTitle(a.title)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      source: "deezer" as const,
      externalId: String(a.id),
      type: "album" as const,
      title: a.title,
      artist: a.artist?.name ?? null,
      imageUrl: a.cover,
      releaseDate: null,
    });
    if (results.length >= limit) break;
  }
  return results;
}

/** Fetch a single Deezer album (includes release_date). */
export async function getAlbum(externalId: string): Promise<SearchResult | null> {
  const url = `${DEEZER_API}/album/${encodeURIComponent(externalId)}`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) return null;

  const a = (await res.json()) as DeezerAlbumFull & { error?: unknown };
  if (a.error || !a.id) return null;

  return {
    source: "deezer",
    externalId: String(a.id),
    type: "album",
    title: a.title,
    artist: a.artist?.name ?? null,
    genre: firstGenre(a.genres),
    imageUrl: bestCover(a),
    releaseDate: a.release_date || null,
  };
}

/** Search Deezer tracks (songs). No auth required. */
export async function searchTracks(query: string, limit = 12): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const url = `${DEEZER_API}/search/track?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) return [];

  const json = (await res.json()) as { data?: DeezerTrack[] };
  return (json.data ?? []).map((t) => ({
    source: "deezer" as const,
    externalId: String(t.id),
    type: "song" as const,
    title: t.title,
    artist: t.artist?.name ?? null,
    album: t.album?.title ?? null,
    imageUrl: t.album ? bestCover(t.album) : null,
    releaseDate: null,
  }));
}

/** Fetch a single Deezer track (includes album + release_date). */
export async function getTrack(externalId: string): Promise<SearchResult | null> {
  const url = `${DEEZER_API}/track/${encodeURIComponent(externalId)}`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) return null;

  const t = (await res.json()) as DeezerTrack & { error?: unknown };
  if (t.error || !t.id) return null;

  // A track carries no genre directly — derive it from its album (cached).
  const genre = t.album?.id ? (await getAlbum(String(t.album.id)))?.genre ?? null : null;

  return {
    source: "deezer",
    externalId: String(t.id),
    type: "song",
    title: t.title,
    artist: t.artist?.name ?? null,
    album: t.album?.title ?? null,
    genre,
    imageUrl: t.album ? bestCover(t.album) : null,
    releaseDate: t.release_date || null,
  };
}

/** URL-safe slug from arbitrary text. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
