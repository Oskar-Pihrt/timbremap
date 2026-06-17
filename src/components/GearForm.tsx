"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { submitGear, updateGear, type GearState } from "@/app/actions/gear";
import { MAX_TITLE_LEN, MAX_DESCRIPTION_LEN } from "@/lib/limits";
import type { Item } from "@/lib/types";

const TYPES = [
  { value: "headphones", label: "Headphones" },
  { value: "iem", label: "IEM" },
  { value: "speaker", label: "Speaker" },
];

/**
 * Create form when `initial` is omitted; edit form when an item is passed.
 * `showDescription` reveals the admin-only description field (edit mode only).
 */
export default function GearForm({
  initial,
  showDescription = false,
}: {
  initial?: Item;
  showDescription?: boolean;
}) {
  const action = initial ? updateGear.bind(null, initial.id) : submitGear;
  const [state, formAction, pending] = useActionState<GearState, FormData>(action, null);
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Type</span>
        <select
          name="type"
          defaultValue={initial?.type ?? "headphones"}
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
        <span className="text-zinc-400">Model</span>
        <input
          name="title"
          type="text"
          required
          maxLength={MAX_TITLE_LEN}
          defaultValue={initial?.title ?? ""}
          placeholder="e.g. HD 600"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Manufacturer</span>
        <input
          name="manufacturer"
          type="text"
          defaultValue={initial?.manufacturer ?? ""}
          placeholder="e.g. Sennheiser"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Price in USD (optional)</span>
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          defaultValue={initial?.price ?? ""}
          placeholder="e.g. 399"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Release date (optional)</span>
        <input
          name="release_date"
          type="date"
          defaultValue={initial?.release_date ?? ""}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-400">Image URL (optional)</span>
        <input
          name="image_url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…/product.jpg"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
        />
      </label>

      {imageUrl && (
        <Image
          src={imageUrl}
          alt="Gear image preview"
          width={120}
          height={120}
          className="rounded-lg object-cover"
          unoptimized
        />
      )}

      {showDescription && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Description (optional)</span>
          <textarea
            name="description"
            rows={4}
            maxLength={MAX_DESCRIPTION_LEN}
            defaultValue={initial?.description ?? ""}
            placeholder="A short description shown on the item page."
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500"
          />
        </label>
      )}

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : initial ? "Save changes" : "Submit gear"}
      </button>
    </form>
  );
}
