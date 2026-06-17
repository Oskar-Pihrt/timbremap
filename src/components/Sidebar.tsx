import Link from "next/link";
import SearchPanel from "@/components/SearchPanel";
import SidebarList from "@/components/SidebarList";
import AuthControls from "@/components/AuthControls";
import { getBrowseItems, getGenres } from "@/lib/items";

export default async function Sidebar() {
  const [items, genres] = await Promise.all([
    getBrowseItems({ sort: "most_voted", limit: 30 }),
    getGenres(),
  ]);

  return (
    <aside className="flex w-full flex-col gap-6 border-zinc-800 p-5 md:h-screen md:w-80 md:shrink-0 md:overflow-y-auto md:border-r lg:w-96">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Timbre<span className="text-indigo-400">map</span>
      </Link>

      <SearchPanel />

      <SidebarList initialItems={items} genres={genres} />

      <div className="border-t border-zinc-800 pt-4 md:mt-auto">
        <AuthControls />
      </div>
    </aside>
  );
}
