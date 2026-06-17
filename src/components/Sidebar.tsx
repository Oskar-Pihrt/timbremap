import Link from "next/link";
import Image from "next/image";
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
      <Link href="/" className="block">
        <Image
          src="/timbermap-logo.png"
          alt="TimbreMap"
          width={180}
          height={56}
          unoptimized
          priority
          className="h-auto w-40"
        />
      </Link>

      <SearchPanel />

      <SidebarList initialItems={items} genres={genres} />

      <div className="border-t border-zinc-800 pt-4 md:mt-auto">
        <AuthControls />
      </div>
    </aside>
  );
}
