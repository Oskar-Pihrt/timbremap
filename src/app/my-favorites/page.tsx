import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";

export const metadata: Metadata = {
  title: "My Favorites",
  robots: { index: false, follow: false },
};

interface FavoriteWithItem {
  created_at: string;
  items: Item | null;
}

export default async function MyFavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("favorites")
    .select("created_at, items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const favorites = (data as unknown as FavoriteWithItem[]) ?? [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">My Favorites</h1>

        {favorites.length === 0 ? (
          <p className="text-zinc-400">
            You haven&apos;t liked anything yet. Open an item and tap the heart to add it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {favorites.map((f) =>
              f.items ? (
                <li key={f.items.id}>
                  <Link
                    href={`/${f.items.type}/${f.items.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800"
                  >
                    {f.items.image_url ? (
                      <Image
                        src={f.items.image_url}
                        alt={`${f.items.title} cover`}
                        width={48}
                        height={48}
                        className="rounded"
                        unoptimized
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-zinc-800" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{f.items.title}</span>
                      <span className="block truncate text-sm text-zinc-400">
                        {f.items.artist ?? f.items.manufacturer}
                      </span>
                    </span>
                    <span className="text-sm capitalize text-zinc-500">{f.items.type}</span>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
