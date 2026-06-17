import Link from "next/link";
import Image from "next/image";
import SearchPanel from "@/components/SearchPanel";
import AuthControls from "@/components/AuthControls";
import { getMostVoted } from "@/lib/items";

export default async function Sidebar() {
  const mostVoted = await getMostVoted(15);

  return (
    <aside className="flex w-full flex-col gap-6 border-zinc-800 md:w-80 md:border-r md:p-5 lg:w-96">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Music<span className="text-indigo-400">Compas</span>
      </Link>

      <SearchPanel />

      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {mostVoted.some((m) => m.vote_count > 0) ? "Most voted" : "Recently added"}
        </h2>
        {mostVoted.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing yet — search for an album to place the first vote.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {mostVoted.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/album/${item.slug}`}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-zinc-800"
                >
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={`${item.title} cover`}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-zinc-800" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-100">{item.title}</span>
                    <span className="block truncate text-xs text-zinc-400">{item.artist}</span>
                  </span>
                  {item.vote_count > 0 && (
                    <span className="text-xs text-zinc-500">{item.vote_count}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto border-t border-zinc-800 pt-4">
        <AuthControls />
      </div>
    </aside>
  );
}
