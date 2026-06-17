"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BrowseItem, BrowseSort } from "@/lib/types";

const SORT_OPTIONS: { value: BrowseSort; label: string }[] = [
  { value: "most_voted", label: "Most voted" },
  { value: "most_liked", label: "Most liked" },
  { value: "most_reviewed", label: "Most reviews" },
  { value: "most_bassy", label: "Most bassy" },
  { value: "most_trebly", label: "Most trebly" },
  { value: "most_technical", label: "Most technical" },
  { value: "most_atmospheric", label: "Most atmospheric" },
];

const selectClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500";

interface SidebarListProps {
  initialItems: BrowseItem[];
  genres: string[];
}

/** The sidebar's sortable + genre-filterable item list. */
export default function SidebarList({ initialItems, genres }: SidebarListProps) {
  const [sort, setSort] = useState<BrowseSort>("most_voted");
  const [genre, setGenre] = useState("");
  const [items, setItems] = useState<BrowseItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  // Re-fetch when the controls change (skip the default state — we already have it).
  useEffect(() => {
    if (sort === "most_voted" && genre === "") {
      setItems(initialItems);
      return;
    }
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (genre) params.set("genre", genre);
    fetch(`/api/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((json: { items: BrowseItem[] }) => {
        if (active) setItems(json.items ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sort, genre, initialItems]);

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)!.label;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          aria-label="Sort items"
          value={sort}
          onChange={(e) => setSort(e.target.value as BrowseSort)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className={selectClass}
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {sortLabel}
        {loading && <span className="ml-2 normal-case text-zinc-600">updating…</span>}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing matches — try another sort or genre, or search above.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/${item.type}/${item.slug}`}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-zinc-800"
              >
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={`${item.title} cover`}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded bg-zinc-800" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-100">{item.title}</span>
                  <span className="block truncate text-xs text-zinc-400">
                    {item.artist ?? item.manufacturer}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {sort === "most_liked"
                    ? item.like_count > 0 && `♥ ${item.like_count}`
                    : sort === "most_reviewed"
                      ? item.review_count > 0 && `${item.review_count}★`
                      : item.vote_count > 0 && item.vote_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
