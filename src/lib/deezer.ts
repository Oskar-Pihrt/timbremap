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
interface DeezerAlbumFull extends DeezerAlbumSearch {
  release_date?: string;
}

function bestCover(a: DeezerAlbumSearch): string | null {
  return a.cover_xl || a.cover_big || a.cover_medium || null;
}

/** Search Deezer albums. No auth required. */
export async function searchAlbums(query: string, limit = 12): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const url = `${DEEZER_API}/search/album?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) return [];

  const json = (await res.json()) as { data?: DeezerAlbumSearch[] };
  return (json.data ?? []).map((a) => ({
    source: "deezer" as const,
    externalId: String(a.id),
    type: "album" as const,
    title: a.title,
    artist: a.artist?.name ?? null,
    imageUrl: bestCover(a),
    releaseDate: null,
  }));
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
    imageUrl: bestCover(a),
    releaseDate: a.release_date || null,
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
