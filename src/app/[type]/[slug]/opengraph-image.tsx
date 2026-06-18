import { ImageResponse } from "next/og";
import { getItemBySlug, getItemStats } from "@/lib/items";
import { describePlacement, toPercent } from "@/lib/compass";
import type { Item, ItemType } from "@/lib/types";

// Dynamic social-share card: the item's cover art rendered *inside* the sound
// compass with the community placement dot + branding. This is what shows when a
// link is shared on Reddit / Discord / X / Slack — far more clickable than the
// bare cover, and it's free advertising for the compass concept itself.

export const runtime = "nodejs";
export const alt = "Timbremap sound-compass placement";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GEAR_TYPES: ItemType[] = ["headphones", "iem", "speaker"];

// Theme (mirrors globals.css — kept inline because satori can't read CSS vars).
const BG = "#191A19";
const FG = "#D8E9A8";
const ACCENT = "#4E9F3D";
const GRID = "rgba(216,233,168,0.22)";

function subtitle(item: Item): string | null {
  return GEAR_TYPES.includes(item.type) ? item.manufacturer : item.artist;
}

/** Best-effort fetch of the cover/product image as a data URL (satori needs the
 *  bytes inline). Returns null on any failure — pasted gear hosts often 403. */
async function loadImage(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = await params;
  const item = await getItemBySlug(slug);

  // Fall back to a plain branded card if the item is missing or the type in the
  // URL doesn't match (keeps the route from throwing).
  if (!item || item.type !== type) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: BG,
            color: FG,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          Timbremap — Sound Compass
        </div>
      ),
      size,
    );
  }

  const stats = await getItemStats(item.id);
  const cover = await loadImage(item.image_url);
  const sub = subtitle(item);
  const placement = describePlacement(stats.avg_x, stats.avg_y);
  const hasAvg = stats.avg_x !== null && stats.avg_y !== null;
  const dot = hasAvg
    ? toPercent(stats.avg_x as number, stats.avg_y as number)
    : { left: "50%", top: "50%" };

  const SQUARE = 470;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: BG,
          color: FG,
          padding: 60,
          gap: 56,
          alignItems: "center",
          fontFamily: "serif",
        }}
      >
        {/* Compass square with cover art as the (dimmed) background */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: SQUARE,
            height: SQUARE,
            border: `2px solid ${GRID}`,
            flexShrink: 0,
            background: "#0d0e0d",
          }}
        >
          {cover && (
            <img
              src={cover}
              alt=""
              width={SQUARE}
              height={SQUARE}
              style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.55 }}
            />
          )}
          {/* Cross-hair grid lines */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: 2,
              background: GRID,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: 2,
              background: GRID,
            }}
          />
          {/* Axis labels */}
          <div style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", fontSize: 22, color: FG }}>
            Treble
          </div>
          <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", fontSize: 22, color: FG }}>
            Bass
          </div>
          <div style={{ position: "absolute", left: 12, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 22, color: FG }}>
            Technical
          </div>
          <div style={{ position: "absolute", right: 12, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 22, color: FG }}>
            Atmospheric
          </div>
          {/* Placement dot (only when there are votes) */}
          {hasAvg && (
            <div
              style={{
                position: "absolute",
                left: dot.left,
                top: dot.top,
                width: 34,
                height: 34,
                marginLeft: -17,
                marginTop: -17,
                borderRadius: 9999,
                background: ACCENT,
                border: "4px solid #fff",
                display: "flex",
              }}
            />
          )}
        </div>

        {/* Text column */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, height: SQUARE, justifyContent: "center" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: ACCENT, display: "flex" }}>
            Timbremap · Sound Compass
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, marginTop: 18, lineHeight: 1.05, display: "flex" }}>
            {item.title}
          </div>
          {sub && (
            <div style={{ fontSize: 34, marginTop: 12, opacity: 0.75, display: "flex" }}>{sub}</div>
          )}
          <div style={{ fontSize: 32, marginTop: 36, color: FG, display: "flex" }}>
            {hasAvg
              ? placement
              : `Be the first to place this on the compass`}
          </div>
          {hasAvg && (
            <div style={{ fontSize: 24, marginTop: 14, opacity: 0.6, display: "flex" }}>
              {stats.vote_count} {stats.vote_count === 1 ? "vote" : "votes"}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
