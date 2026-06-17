import { type NextRequest, NextResponse } from "next/server";
import { searchAlbums } from "@/lib/deezer";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const results = await searchAlbums(q, 12);
  return NextResponse.json({ results });
}
