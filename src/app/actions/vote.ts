"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { importDeezerAlbum } from "@/lib/items";
import { clamp } from "@/lib/compass";

/**
 * Import a Deezer album (if not already imported) and redirect to its page.
 * Called from search results when a user picks an album.
 */
export async function openDeezerAlbum(externalId: string): Promise<void> {
  const item = await importDeezerAlbum(externalId);
  if (!item) throw new Error("Could not import that album.");
  redirect(`/album/${item.slug}`);
}

/**
 * Cast or update the signed-in user's vote for an item. One row per
 * (user, item) — upsert on the unique constraint.
 */
export async function castVote(
  itemId: string,
  slug: string,
  x: number,
  y: number,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to vote." };

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

  revalidatePath(`/album/${slug}`);
}
