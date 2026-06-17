"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { importDeezerAlbum, importDeezerSong } from "@/lib/items";
import { checkRateLimit } from "@/lib/ratelimit";
import { clamp } from "@/lib/compass";
import type { ItemType } from "@/lib/types";

/**
 * Import a Deezer item (album or song, if not already imported) and redirect to
 * its page. Called from search results when a user picks a result.
 */
export async function openDeezerItem(type: ItemType, externalId: string): Promise<void> {
  const item =
    type === "song"
      ? await importDeezerSong(externalId)
      : await importDeezerAlbum(externalId);
  if (!item) throw new Error("Could not import that item.");
  redirect(`/${item.type}/${item.slug}`);
}

/**
 * Cast or update the signed-in user's vote for an item. One row per
 * (user, item) — upsert on the unique constraint.
 */
export async function castVote(
  itemId: string,
  type: ItemType,
  slug: string,
  x: number,
  y: number,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to vote." };

  if (!(await checkRateLimit("vote", 60, "1 minute")))
    return { error: "Too many votes — slow down and try again shortly." };

  const { error } = await supabase.from("votes").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      x: clamp(x),
      y: clamp(y),
    },
    { onConflict: "user_id,item_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/${type}/${slug}`);
}
