import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import Compass from "@/components/Compass";
import {
  getItemBySlug,
  getItemStats,
  getVotes,
  getUserVote,
  getRecommendations,
} from "@/lib/items";
import { createClient } from "@/lib/supabase/server";
import { describePlacement } from "@/lib/compass";
import type { ItemType, NearbyItem } from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const REC_TYPES: { type: ItemType; label: string }[] = [
  { type: "album", label: "Albums" },
  { type: "song", label: "Songs" },
  { type: "headphones", label: "Headphones" },
  { type: "iem", label: "IEMs" },
  { type: "speaker", label: "Speakers" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  if (!item) return { title: "Not found" };

  const stats = await getItemStats(item.id);
  const placement = describePlacement(stats.avg_x, stats.avg_y);
  const titleText = item.artist ? `${item.title} by ${item.artist}` : item.title;
  const description =
    stats.vote_count > 0
      ? `Community sound-compass placement for ${titleText}: ${placement.toLowerCase()} (from ${stats.vote_count} vote${stats.vote_count === 1 ? "" : "s"}).`
      : `Be the first to place ${titleText} on the MusicCompas sound compass.`;

  return {
    title: titleText,
    description,
    alternates: { canonical: `${siteUrl}/album/${slug}` },
    openGraph: {
      title: `${titleText} — Sound Compass`,
      description,
      type: "music.album",
      url: `${siteUrl}/album/${slug}`,
      images: item.image_url ? [{ url: item.image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleText} — Sound Compass`,
      description,
      images: item.image_url ? [item.image_url] : undefined,
    },
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  if (!item) notFound();

  const [stats, votes] = await Promise.all([getItemStats(item.id), getVotes(item.id)]);
  const userVote = await getUserVote(item.id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recsByType = await Promise.all(
    REC_TYPES.map(async ({ type, label }) => ({
      label,
      items: await getRecommendations(item.id, type, 3),
    })),
  );
  const hasRecs = recsByType.some((r) => r.items.length > 0);

  const avg =
    stats.avg_x !== null && stats.avg_y !== null
      ? { x: stats.avg_x, y: stats.avg_y }
      : null;
  const placement = describePlacement(stats.avg_x, stats.avg_y);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: item.title,
    ...(item.artist && { byArtist: { "@type": "MusicGroup", name: item.artist } }),
    ...(item.release_date && { datePublished: item.release_date }),
    ...(item.image_url && { image: item.image_url }),
    url: `${siteUrl}/album/${slug}`,
    ...(stats.vote_count > 0 && {
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/VoteAction",
        userInteractionCount: stats.vote_count,
      },
    }),
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="flex flex-col gap-8 lg:flex-row">
        {/* Detail column */}
        <div className="flex flex-col gap-5 lg:w-72">
          {item.image_url && (
            <Image
              src={item.image_url}
              alt={`${item.title} cover art`}
              width={288}
              height={288}
              className="w-full rounded-xl"
              priority
            />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
            {item.artist && <p className="text-zinc-400">{item.artist}</p>}
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Type</dt>
              <dd className="capitalize">{item.type}</dd>
            </div>
            {item.release_date && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Released</dt>
                <dd>{item.release_date}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-zinc-500">Votes</dt>
              <dd>{stats.vote_count}</dd>
            </div>
          </dl>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Community placement
            </p>
            <p className="mt-1 text-zinc-200">{placement}</p>
          </div>
        </div>

        {/* Compass + recommendations */}
        <div className="flex flex-1 flex-col gap-8">
          <Compass
            itemId={item.id}
            slug={item.slug}
            imageUrl={item.image_url}
            title={item.title}
            votes={votes.map((v) => ({ x: v.x, y: v.y }))}
            avg={avg}
            voteCount={stats.vote_count}
            userVote={userVote ? { x: userVote.x, y: userVote.y } : null}
            isLoggedIn={!!user}
          />

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Sounds similar</h2>
            {!hasRecs ? (
              <p className="text-sm text-zinc-500">
                Not enough votes yet to recommend similar items. Vote on more items to build
                the map.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {recsByType
                  .filter((r) => r.items.length > 0)
                  .map((r) => (
                    <div key={r.label}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {r.label}
                      </h3>
                      <ul className="flex flex-wrap gap-3">
                        {r.items.map((rec) => (
                          <RecCard key={rec.id} rec={rec} />
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </article>
    </AppShell>
  );
}

function RecCard({ rec }: { rec: NearbyItem }) {
  return (
    <li>
      <Link
        href={`/album/${rec.slug}`}
        className="flex w-44 items-center gap-2 rounded-lg border border-zinc-800 p-2 hover:bg-zinc-800"
      >
        {rec.image_url ? (
          <Image
            src={rec.image_url}
            alt={`${rec.title} cover`}
            width={40}
            height={40}
            className="rounded"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-zinc-800" />
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm">{rec.title}</span>
          <span className="block truncate text-xs text-zinc-400">{rec.artist}</span>
        </span>
      </Link>
    </li>
  );
}
