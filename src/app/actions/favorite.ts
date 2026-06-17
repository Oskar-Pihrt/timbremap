"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import type { ItemType } from "@/lib/types";

/**
 * Toggle the signed-in user's favorite ("like") on an item. Favorited items
 * show up in the user's My Favorites list, and per-item counts feed the
 * "most liked" browse sort.
 */
export async function toggleFavorite(
  itemId: string,
  type: ItemType,
  slug: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (!(await checkRateLimit("favorite", 60, "1 minute"))) return;

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("item_id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("favorites").insert({ item_id: itemId, user_id: user.id });
  }
  revalidatePath(`/${type}/${slug}`);
}
