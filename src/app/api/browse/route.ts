import { NextResponse, type NextRequest } from "next/server";
import { getBrowseItems } from "@/lib/items";
import type { BrowseSort, ItemType } from "@/lib/types";

const SORTS: BrowseSort[] = [
  "most_voted",
  "most_liked",
  "most_reviewed",
  "most_bassy",
  "most_trebly",
  "most_technical",
  "most_atmospheric",
];
const TYPES: ItemType[] = ["album", "song", "headphones", "iem", "speaker"];

/** Browse items for the sidebar list, sorted/filtered. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const sortRaw = sp.get("sort") ?? "";
  const typeRaw = sp.get("type") ?? "";
  const genre = sp.get("genre") ?? "";

  const sort: BrowseSort = SORTS.includes(sortRaw as BrowseSort)
    ? (sortRaw as BrowseSort)
    : "most_voted";
  const type = TYPES.includes(typeRaw as ItemType) ? (typeRaw as ItemType) : null;

  const items = await getBrowseItems({ sort, genre: genre || null, type, limit: 30 });
  return NextResponse.json({ items });
}
