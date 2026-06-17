import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import BrowseControls from "@/components/BrowseControls";
import { getBrowseItems, getGenres } from "@/lib/items";
import type { BrowseItem, BrowseSort, ItemType } from "@/lib/types";

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; genre?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const sort: BrowseSort = SORTS.includes(sp.sort as BrowseSort)
    ? (sp.sort as BrowseSort)
    : "most_voted";
  const type = TYPES.includes(sp.type as ItemType) ? (sp.type as ItemType) : "";
  const genre = sp.genre ?? "";

  const [items, genres] = await Promise.all([
    getBrowseItems({ sort, genre: genre || null, type: (type || null) as ItemType | null }),
    getGenres(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Browse the sound compass</h1>
          <p className="max-w-2xl text-zinc-300">
            Timbremap maps music and audio gear on two axes — <strong>treble ↔ bass</strong>{" "}
            and <strong>technical ↔ atmospheric</strong>. Vote on where something sits, see the
            community consensus, and discover items that sound alike.
          </p>
        </div>

        <BrowseControls sort={sort} genre={genre} type={type} genres={genres} />

        {items.length === 0 ? (
          <p className="text-zinc-400">
            Nothing matches yet. Try a different filter, or search for an album in the sidebar to
            place the first vote.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <BrowseCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function BrowseCard({ item }: { item: BrowseItem }) {
  return (
    <li>
      <Link
        href={`/${item.type}/${item.slug}`}
        className="flex h-full flex-col gap-2 rounded-xl border border-zinc-800 p-3 hover:bg-zinc-800"
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={`${item.title} cover`}
            width={300}
            height={300}
            className="aspect-square w-full rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div className="aspect-square w-full rounded-lg bg-zinc-800" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
          <p className="truncate text-xs text-zinc-400">
            {item.artist ?? item.manufacturer ?? <span className="capitalize">{item.type}</span>}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-3 text-xs text-zinc-500">
          <span>{item.vote_count} votes</span>
          {item.like_count > 0 && <span>♥ {item.like_count}</span>}
        </div>
      </Link>
    </li>
  );
}
