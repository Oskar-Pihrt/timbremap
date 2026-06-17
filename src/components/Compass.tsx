"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { castVote } from "@/app/actions/vote";
import { fromFraction, toPercent } from "@/lib/compass";

type Point = { x: number; y: number };

interface CompassProps {
  itemId: string;
  slug: string;
  imageUrl: string | null;
  title: string;
  votes: Point[];
  avg: Point | null;
  voteCount: number;
  userVote: Point | null;
  isLoggedIn: boolean;
}

export default function Compass({
  itemId,
  slug,
  imageUrl,
  title,
  votes,
  avg,
  voteCount,
  userVote,
  isLoggedIn,
}: CompassProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"average" | "all">("average");
  const [draft, setDraft] = useState<Point | null>(userVote);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isLoggedIn) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setDraft(fromFraction(fx, fy));
    setError(null);
  }

  function save() {
    if (!draft) return;
    startTransition(async () => {
      const result = await castVote(itemId, slug, draft.x, draft.y);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  const dirty =
    draft !== null && (!userVote || userVote.x !== draft.x || userVote.y !== draft.y);

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <ToggleButton active={mode === "average"} onClick={() => setMode("average")}>
          Average
        </ToggleButton>
        <ToggleButton active={mode === "all"} onClick={() => setMode("all")}>
          All votes ({voteCount})
        </ToggleButton>
      </div>

      {/* Compass square with axis labels */}
      <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] items-center gap-2">
        <div className="col-start-2 text-center text-xs font-medium text-zinc-400">Treble</div>

        <div className="row-start-2 -rotate-180 text-center text-xs font-medium text-zinc-400 [writing-mode:vertical-rl]">
          Technical
        </div>

        <div
          onClick={handleClick}
          className={`relative row-start-2 aspect-square w-full max-w-xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 ${
            isLoggedIn ? "cursor-crosshair" : ""
          }`}
        >
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={`${title} cover art`}
              fill
              sizes="(max-width: 768px) 100vw, 576px"
              className="object-cover opacity-40"
            />
          )}

          {/* Axis crosshair */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/20" />
          </div>

          {/* Dots */}
          <div className="pointer-events-none absolute inset-0">
            {mode === "all" &&
              votes.map((v, i) => (
                <Dot key={i} point={v} className="h-2.5 w-2.5 bg-indigo-400/70" />
              ))}

            {mode === "average" && avg && (
              <Dot
                point={avg}
                className="h-4 w-4 bg-indigo-500 ring-2 ring-white"
                label="Average"
              />
            )}

            {draft && (
              <Dot
                point={draft}
                className="h-4 w-4 border-2 border-white bg-emerald-500"
                label={dirty ? "Your pick" : "Your vote"}
              />
            )}
          </div>
        </div>

        <div className="row-start-2 text-center text-xs font-medium text-zinc-400 [writing-mode:vertical-rl]">
          Atmospheric
        </div>

        <div className="col-start-2 text-center text-xs font-medium text-zinc-400">Bass</div>
      </div>

      {/* Vote controls */}
      {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={!dirty || pending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {pending ? "Saving…" : userVote ? "Update my vote" : "Save my vote"}
          </button>
          <span className="text-sm text-zinc-500">
            {draft
              ? "Click anywhere on the compass to adjust."
              : "Click on the compass to place your vote."}
          </span>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          <a href="/login" className="text-indigo-400 hover:underline">
            Log in
          </a>{" "}
          to place your vote.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

function Dot({
  point,
  className,
  label,
}: {
  point: Point;
  className: string;
  label?: string;
}) {
  const { left, top } = toPercent(point.x, point.y);
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
      title={label}
    >
      <div className={`rounded-full ${className}`} />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        active ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
