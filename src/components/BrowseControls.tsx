"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { BrowseSort } from "@/lib/types";

const SORT_OPTIONS: { value: BrowseSort; label: string }[] = [
  { value: "most_voted", label: "Most voted" },
  { value: "most_liked", label: "Most liked" },
  { value: "most_reviewed", label: "Most reviews" },
  { value: "most_bassy", label: "Most bassy" },
  { value: "most_trebly", label: "Most trebly" },
  { value: "most_technical", label: "Most technical" },
  { value: "most_atmospheric", label: "Most atmospheric" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "album", label: "Albums" },
  { value: "song", label: "Songs" },
  { value: "headphones", label: "Headphones" },
  { value: "iem", label: "IEMs" },
  { value: "speaker", label: "Speakers" },
];

interface BrowseControlsProps {
  sort: BrowseSort;
  genre: string;
  type: string;
  genres: string[];
}

const selectClass =
  "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500";

export default function BrowseControls({ sort, genre, type, genres }: BrowseControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Sort by
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Type
        <select
          value={type}
          onChange={(e) => update("type", e.target.value)}
          className={selectClass}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Genre
        <select
          value={genre}
          onChange={(e) => update("genre", e.target.value)}
          className={selectClass}
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
