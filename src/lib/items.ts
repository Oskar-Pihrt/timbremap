import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlbum, slugify } from "@/lib/deezer";
import type { Item, ItemStats, ItemType, NearbyItem, Vote } from "@/lib/types";

/** Fetch one item by its slug, or null. */
export async function getItemBySlug(slug: string): Promise<Item | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Item) ?? null;
}

/** Aggregate placement (avg_x, avg_y) + vote_count for one item. */
export async function getItemStats(itemId: string): Promise<ItemStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("item_stats")
    .select("*")
    .eq("item_id", itemId)
    .maybeSingle();
  return (
    (data as ItemStats) ?? { item_id: itemId, vote_count: 0, avg_x: null, avg_y: null }
  );
}

/** Every vote for an item (the "all votes" view). */
export async function getVotes(itemId: string): Promise<Vote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("votes")
    .select("*")
    .eq("item_id", itemId);
  return (data as Vote[]) ?? [];
}

/** The signed-in user's vote for an item, if any. */
export async function getUserVote(itemId: string): Promise<Vote | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("votes")
    .select("*")
    .eq("item_id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as Vote) ?? null;
}

/** Most-voted items (home fallback list). */
export async function getMostVoted(limit = 20): Promise<(Item & { vote_count: number })[]> {
  const supabase = await createClient();
  const { data: stats } = await supabase
    .from("item_stats")
    .select("*")
    .order("vote_count", { ascending: false })
    .limit(limit);

  const rows = (stats as ItemStats[]) ?? [];
  const withVotes = rows.filter((s) => s.vote_count > 0);
  if (withVotes.length === 0) {
    // No votes yet anywhere — just show the most recently added items.
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as Item[]) ?? []).map((i) => ({ ...i, vote_count: 0 }));
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .in("id", withVotes.map((s) => s.item_id));

  const byId = new Map((items as Item[] | null)?.map((i) => [i.id, i]) ?? []);
  return withVotes
    .map((s) => {
      const item = byId.get(s.item_id);
      return item ? { ...item, vote_count: s.vote_count } : null;
    })
    .filter((x): x is Item & { vote_count: number } => x !== null);
}

/** Nearest items of a given type to the target item (recommendations). */
export async function getRecommendations(
  itemId: string,
  type: ItemType,
  limit = 3,
): Promise<NearbyItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("nearby_items", {
    target_item: itemId,
    result_type: type,
    max_results: limit,
  });
  return (data as NearbyItem[]) ?? [];
}

/**
 * Import a Deezer album into `items` (idempotent on external id) and return it.
 * Uses the service-role client so it works regardless of who is signed in.
 */
export async function importDeezerAlbum(externalId: string): Promise<Item | null> {
  const admin = createAdminClient();

  // Already imported?
  const { data: existing } = await admin
    .from("items")
    .select("*")
    .eq("external_source", "deezer")
    .eq("external_id", externalId)
    .maybeSingle();
  if (existing) return existing as Item;

  const album = await getAlbum(externalId);
  if (!album) return null;

  const base = slugify(`${album.artist ?? ""} ${album.title}`) || `album-${externalId}`;
  const slug = await uniqueSlug(admin, base, externalId);

  const { data, error } = await admin
    .from("items")
    .insert({
      type: "album",
      slug,
      title: album.title,
      artist: album.artist,
      image_url: album.imageUrl,
      release_date: album.releaseDate,
      external_source: "deezer",
      external_id: externalId,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    // Lost a race — fetch the row that won.
    const { data: row } = await admin
      .from("items")
      .select("*")
      .eq("external_source", "deezer")
      .eq("external_id", externalId)
      .maybeSingle();
    return (row as Item) ?? null;
  }
  return data as Item;
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function uniqueSlug(
  admin: AdminClient,
  base: string,
  externalId: string,
): Promise<string> {
  const { data } = await admin.from("items").select("id").eq("slug", base).maybeSingle();
  if (!data) return base;
  // Disambiguate with a short suffix from the external id.
  return `${base}-${externalId.slice(-6)}`;
}
