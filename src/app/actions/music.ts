"use server";

import { redirect } from "next/navigation";
import { createMusicItem, adminUpdateItem, isCurrentUserAdmin } from "@/lib/items";
import { MAX_TITLE_LEN, MAX_GENRES, MAX_GENRE_LEN } from "@/lib/limits";
import { checkRateLimit } from "@/lib/ratelimit";
import type { ItemType } from "@/lib/types";

export type MusicState = { error: string } | null;

const MUSIC_TYPES: ItemType[] = ["album", "song"];

/** Split a comma-separated genres input into a clean, de-duplicated array. */
function parseGenres(raw: string): string[] {
  const seen = new Set<string>();
  for (const g of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    seen.add(g);
  }
  return [...seen];
}

/** Parse and validate the shared music form fields. */
function parseMusicForm(
  formData: FormData,
):
  | { error: string }
  | {
      type: "album" | "song";
      title: string;
      artist: string;
      album: string | null;
      genres: string[];
      releaseDate: string;
      imageUrl: string;
    } {
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim();
  const album = String(formData.get("album") ?? "").trim();
  const genres = parseGenres(String(formData.get("genres") ?? ""));
  const releaseDate = String(formData.get("release_date") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!MUSIC_TYPES.includes(type as ItemType)) return { error: "Pick album or song." };
  if (!title) return { error: "A title is required." };
  if (title.length > MAX_TITLE_LEN) return { error: `Title is too long (max ${MAX_TITLE_LEN}).` };
  if (!artist) return { error: "An artist is required." };
  if (type === "song" && !album) return { error: "An album is required." };
  if (genres.length === 0) return { error: "At least one genre is required." };
  if (genres.length > MAX_GENRES) return { error: `Too many genres (max ${MAX_GENRES}).` };
  if (genres.some((g) => g.length > MAX_GENRE_LEN))
    return { error: `A genre is too long (max ${MAX_GENRE_LEN} characters).` };
  if (!releaseDate) return { error: "A release date is required." };
  if (!imageUrl) return { error: "A cover image URL is required." };

  return {
    type: type as "album" | "song",
    title,
    artist,
    album: type === "song" ? album : null,
    genres,
    releaseDate,
    imageUrl,
  };
}

/** Create a user-submitted album/song (pending moderation), then redirect. */
export async function submitMusic(
  _prev: MusicState,
  formData: FormData,
): Promise<MusicState> {
  const parsed = parseMusicForm(formData);
  if ("error" in parsed) return parsed;

  if (!(await checkRateLimit("submit", 20, "24 hours")))
    return { error: "Daily submission limit reached — try again tomorrow." };

  const { item, error } = await createMusicItem(parsed);
  if (error || !item) return { error: error ?? "Could not submit." };
  redirect(`/${item.type}/${item.slug}`);
}

/** Admin-only edit of an album/song (title, metadata, description). */
export async function updateMusic(
  itemId: string,
  _prev: MusicState,
  formData: FormData,
): Promise<MusicState> {
  if (!(await isCurrentUserAdmin())) return { error: "Admins only." };

  const parsed = parseMusicForm(formData);
  if ("error" in parsed) return parsed;

  const { item, error } = await adminUpdateItem(itemId, parsed);
  if (error || !item) return { error: error ?? "Could not save changes." };
  redirect(`/${item.type}/${item.slug}`);
}
