export type ItemType = "album" | "song" | "headphones" | "iem" | "speaker";
export type ItemStatus = "active" | "pending" | "rejected";

export interface Item {
  id: string;
  type: ItemType;
  slug: string;
  title: string;
  artist: string | null;
  album: string | null;
  manufacturer: string | null;
  image_url: string | null;
  release_date: string | null;
  external_source: string | null;
  external_id: string | null;
  created_by: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  item_id: string;
  x: number;
  y: number;
  created_at: string;
  updated_at: string;
}

export interface ItemStats {
  item_id: string;
  vote_count: number;
  avg_x: number | null;
  avg_y: number | null;
}

/** A recommendation row returned by the nearby_items RPC. */
export interface NearbyItem {
  id: string;
  slug: string;
  title: string;
  artist: string | null;
  image_url: string | null;
  type: ItemType;
  avg_x: number;
  avg_y: number;
  vote_count: number;
  distance: number;
}

/** A normalized search result from a music source (Deezer). */
export interface SearchResult {
  source: "deezer";
  externalId: string;
  type: ItemType;
  title: string;
  artist: string | null;
  imageUrl: string | null;
  releaseDate: string | null;
}
