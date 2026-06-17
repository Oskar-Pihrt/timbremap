import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { describePlacement } from "@/lib/compass";
import type { Item } from "@/lib/types";

export const metadata: Metadata = {
  title: "My Votes",
  robots: { index: false, follow: false },
};

interface VoteWithItem {
  x: number;
  y: number;
  updated_at: string;
  items: Item | null;
}

export default async function MyVotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("votes")
    .select("x, y, updated_at, items(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const votes = (data as unknown as VoteWithItem[]) ?? [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">My Votes</h1>

        {votes.length === 0 ? (
          <p className="text-zinc-400">
            You haven&apos;t placed any votes yet. Search for an album and click on its compass.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {votes.map((v) =>
              v.items ? (
                <li key={v.items.id}>
                  <Link
                    href={`/album/${v.items.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800"
                  >
                    {v.items.image_url ? (
                      <Image
                        src={v.items.image_url}
                        alt={`${v.items.title} cover`}
                        width={48}
                        height={48}
                        className="rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-zinc-800" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{v.items.title}</span>
                      <span className="block truncate text-sm text-zinc-400">
                        {v.items.artist}
                      </span>
                    </span>
                    <span className="hidden text-sm text-zinc-500 sm:block">
                      {describePlacement(v.x, v.y)}
                    </span>
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
