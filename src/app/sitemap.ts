import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Evaluated per request, not at build time (the DB may be offline during build).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let items: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("items")
      .select("slug, updated_at, type")
      .eq("status", "active");

    items = (data ?? []).map((i) => ({
      url: `${siteUrl}/${i.type}/${i.slug}`,
      lastModified: new Date(i.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unreachable — still emit the homepage entry below.
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...items,
  ];
}
