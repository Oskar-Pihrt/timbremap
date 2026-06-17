"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  saveReview,
  deleteReview,
  toggleReviewLike,
  type ReviewState,
} from "@/app/actions/review";
import type { ItemType, Review, ReviewWithAuthor } from "@/lib/types";

interface ReviewsProps {
  itemId: string;
  type: ItemType;
  slug: string;
  reviews: ReviewWithAuthor[];
  userReview: Review | null;
  currentUserId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function Reviews({
  itemId,
  type,
  slug,
  reviews,
  userReview,
  currentUserId,
  isLoggedIn,
  isAdmin,
}: ReviewsProps) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    saveReview,
    null,
  );
  const [editing, setEditing] = useState(false);

  // The hidden fields shared by the save form.
  const hiddenFields = (
    <>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="slug" value={slug} />
    </>
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        Reviews
        {reviews.length > 0 && <span className="text-zinc-500"> ({reviews.length})</span>}
      </h2>

      {/* Write a review (only when logged in and the user hasn't reviewed yet). */}
      {isLoggedIn && !userReview && (
        <form action={formAction} className="flex flex-col gap-2">
          {hiddenFields}
          <textarea
            name="body"
            required
            rows={4}
            placeholder="Share what you think about how this sounds…"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          />
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Post review"}
          </button>
        </form>
      )}

      {!isLoggedIn && (
        <p className="text-sm text-zinc-400">
          <Link href="/login" className="text-indigo-400 hover:underline">
            Log in
          </Link>{" "}
          to write a review or like others.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">No reviews yet. Be the first.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => {
            const isOwn = r.user_id === currentUserId;
            return (
              <li key={r.id} className="rounded-lg border border-zinc-800 p-3">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {isOwn ? "You" : r.author_name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </span>
                </div>

                {isOwn && editing ? (
                  <form action={formAction} className="flex flex-col gap-2">
                    {hiddenFields}
                    <textarea
                      name="body"
                      required
                      rows={4}
                      defaultValue={r.body}
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                    />
                    {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={pending}
                        onClick={() => setEditing(false)}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {pending ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="text-sm text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="whitespace-pre-line text-sm text-zinc-300">{r.body}</p>
                )}

                {!(isOwn && editing) && (
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    {isOwn ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          className="text-indigo-400 hover:underline"
                        >
                          Edit
                        </button>
                        <span className="text-zinc-600">·</span>
                        <form action={deleteReview.bind(null, r.id, itemId, type, slug)}>
                          <button type="submit" className="text-zinc-400 hover:text-red-400">
                            Delete
                          </button>
                        </form>
                      </>
                    ) : isLoggedIn ? (
                      <>
                        <form action={toggleReviewLike.bind(null, r.id, type, slug)}>
                          <button
                            type="submit"
                            className={`flex items-center gap-1 ${
                              r.liked_by_me
                                ? "text-rose-400"
                                : "text-zinc-400 hover:text-rose-400"
                            }`}
                          >
                            <span>{r.liked_by_me ? "♥" : "♡"}</span>
                            {r.like_count > 0 && <span>{r.like_count}</span>}
                          </button>
                        </form>
                        {isAdmin && (
                          <>
                            <span className="text-zinc-600">·</span>
                            <form action={deleteReview.bind(null, r.id, itemId, type, slug)}>
                              <button
                                type="submit"
                                className="text-zinc-400 hover:text-red-400"
                              >
                                Delete
                              </button>
                            </form>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <span>♡</span>
                        {r.like_count > 0 && <span>{r.like_count}</span>}
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
