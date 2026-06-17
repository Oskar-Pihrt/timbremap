"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { openDeezerAlbum } from "@/app/actions/vote";
import type { SearchResult } from "@/lib/types";

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();

    const handle = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as { results: SearchResult[] };
        setResults(json.results ?? []);
      } catch {
        /* aborted or network error — ignore */
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search albums…"
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
      />

      {loading && <p className="text-sm text-zinc-500">Searching…</p>}

      <ul className="flex flex-col gap-1">
        {results.map((r) => (
          <li key={`${r.source}-${r.externalId}`}>
            <form action={openDeezerAlbum.bind(null, r.externalId)}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-zinc-800"
              >
                {r.imageUrl ? (
                  <Image
                    src={r.imageUrl}
                    alt={`${r.title} cover`}
                    width={44}
                    height={44}
                    className="rounded"
                  />
                ) : (
                  <div className="h-11 w-11 rounded bg-zinc-800" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm text-zinc-100">{r.title}</span>
                  <span className="block truncate text-xs text-zinc-400">{r.artist}</span>
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
