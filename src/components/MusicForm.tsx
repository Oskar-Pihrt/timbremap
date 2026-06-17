"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { submitMusic, updateMusic, type MusicState } from "@/app/actions/music";
import { MAX_TITLE_LEN, MAX_GENRES, MAX_GENRE_LEN } from "@/lib/limits";
import type { Item } from "@/lib/types";

const TYPES = [
  { value: "album", label: "Album" },
  { value: "song", label: "Song" },
];

/**
 * Create form when `initial` is omitted; admin edit form when an item is passed.
 * All music fields are required (gear keeps its optional fields elsewhere).
 */
export default function MusicForm({
  initial,
}: {
  initial?: Item;
}) {
  const action = initial ? updateMusic.bind(null, initial.id) : submitMusic;
  const [state, formAction, pending] = useActionState<MusicState, FormData>(action, null);
  const [type, setType] = useState(initial?.type === "song" ? "song" : "album");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Type</span>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Title</span>
        <input
          name="title"
          type="text"
          required
          maxLength={MAX_TITLE_LEN}
          defaultValue={initial?.title ?? ""}
          placeholder="e.g. Kid A"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Artist</span>
        <input
          name="artist"
          type="text"
          required
          defaultValue={initial?.artist ?? ""}
          placeholder="e.g. Radiohead"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      {type === "song" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Album</span>
          <input
            name="album"
            type="text"
            required
            defaultValue={initial?.album ?? ""}
            placeholder="e.g. Kid A"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Genres (comma-separated)</span>
        <input
          name="genres"
          type="text"
          required
          maxLength={MAX_GENRES * (MAX_GENRE_LEN + 2)}
          defaultValue={initial?.genres?.join(", ") ?? ""}
          placeholder="e.g. art rock, electronic"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Release date</span>
        <input
          name="release_date"
          type="date"
          required
          defaultValue={initial?.release_date ?? ""}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Cover image URL</span>
        <input
          name="image_url"
          type="url"
          required
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…/cover.jpg"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      {imageUrl && (
        <Image
          src={imageUrl}
          alt="Cover image preview"
          width={120}
          height={120}
          className="rounded-lg object-cover"
          unoptimized
        />
      )}

      {state?.error &&<p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : initial ? "Save changes" : "Submit"}
      </button>
    </form>
  );
}
