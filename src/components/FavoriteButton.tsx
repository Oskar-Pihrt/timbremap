"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleFavorite } from "@/app/actions/favorite";
import type { ItemType } from "@/lib/types";

interface FavoriteButtonProps {
  itemId: string;
  type: ItemType;
  slug: string;
  count: number;
  favorited: boolean;
  isLoggedIn: boolean;
}

/** Heart toggle: like/favorite an item. Shows the public like count. */
export default function FavoriteButton({
  itemId,
  type,
  slug,
  count,
  favorited,
  isLoggedIn,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        <span>♡</span>
        <span>{count > 0 ? `${count} ` : ""}Log in to like</span>
      </Link>
    );
  }

  function toggle() {
    startTransition(async () => {
      await toggleFavorite(itemId, type, slug);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
        favorited
          ? "border-rose-500 bg-rose-500/10 text-rose-400"
          : "border-zinc-700 text-zinc-200 hover:bg-zinc-800"
      }`}
    >
      <span>{favorited ? "♥" : "♡"}</span>
      <span>
        {favorited ? "Liked" : "Like"}
        {count > 0 ? ` · ${count}` : ""}
      </span>
    </button>
  );
}
