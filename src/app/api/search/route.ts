import { type NextRequest, NextResponse } from "next/server";
import { searchAlbums, searchTracks } from "@/lib/deezer";
import { searchGear } from "@/lib/items";
import type { SearchResult } from "@/lib/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const type = request.nextUrl.searchParams.get("type") ?? "album";
  if (!q) return NextResponse.json({ results: [] });

  if (type === "song") {
    const results = await searchTracks(q, 12);
    return NextResponse.json({ results });
  }

  if (type === "gear") {
    const items = await searchGear(q, 12);
    const results: SearchResult[] = items.map((i) => ({
      source: "local",
      externalId: i.id,
      type: i.type,
      title: i.title,
      artist: i.manufacturer,
      imageUrl: i.image_url,
      releaseDate: i.release_date,
      slug: i.slug,
    }));
    return NextResponse.json({ results });
  }

  const results = await searchAlbums(q, 12);
  return NextResponse.json({ results });
}
