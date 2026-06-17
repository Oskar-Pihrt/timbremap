"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/items";
import { MAX_REVIEW_LEN } from "@/lib/limits";
import { checkRateLimit } from "@/lib/ratelimit";
import type { ItemType } from "@/lib/types";

export type ReviewState = { error: string } | null;

/**
 * Create or update the signed-in user's review for an item. One row per
 * (user, item) — upsert on the unique constraint, so re-submitting edits it.
 */
export async function saveReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const itemId = String(formData.get("item_id") ?? "");
  const type = String(formData.get("type") ?? "") as ItemType;
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!itemId || !slug) return { error: "Missing item." };
  if (!body) return { error: "Write something before saving." };
  if (body.length > MAX_REVIEW_LEN)
    return { error: `Review is too long (max ${MAX_REVIEW_LEN} characters).` };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to review." };

  if (!(await checkRateLimit("review", 30, "1 hour")))
    return { error: "Too many reviews — try again later." };

  const { error } = await supabase
    .from("reviews")
    .upsert(
      { user_id: user.id, item_id: itemId, body },
      { onConflict: "user_id,item_id" },
    );
  if (error) return { error: error.message };

  revalidatePath(`/${type}/${slug}`);
  return null;
}

/**
 * Delete a review. A user can delete their own; an admin can delete any (RLS
 * permits the by-id delete). `reviewId` is passed so admins can target others'.
 */
export async function deleteReview(
  reviewId: string,
  itemId: string,
  type: ItemType,
  slug: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (await isCurrentUserAdmin()) {
    await supabase.from("reviews").delete().eq("id", reviewId);
  } else {
    await supabase
      .from("reviews")
      .delete()
      .eq("item_id", itemId)
      .eq("user_id", user.id);
  }
  revalidatePath(`/${type}/${slug}`);
}

/** Toggle the signed-in user's like on a review (likes reorder the list). */
export async function toggleReviewLike(
  reviewId: string,
  type: ItemType,
  slug: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (!(await checkRateLimit("review_like", 60, "1 minute"))) return;

  const { data: existing } = await supabase
    .from("review_likes")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("review_likes").delete().eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("review_likes").insert({ review_id: reviewId, user_id: user.id });
  }
  revalidatePath(`/${type}/${slug}`);
}
