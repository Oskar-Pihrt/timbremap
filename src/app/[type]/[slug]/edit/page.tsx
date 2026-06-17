import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import GearForm from "@/components/GearForm";
import { getItemBySlug, isCurrentUserAdmin } from "@/lib/items";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit gear",
  robots: { index: false, follow: false },
};

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const GEAR_TYPES = ["headphones", "iem", "speaker"];
  const item = await getItemBySlug(slug);
  // Only gear is editable (GearForm); the creator or an admin may edit it.
  const isAdmin = await isCurrentUserAdmin();
  if (
    !item ||
    item.type !== type ||
    !GEAR_TYPES.includes(item.type) ||
    (item.created_by !== user.id && !isAdmin)
  ) {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit {item.title}</h1>
        <GearForm initial={item} />
      </div>
    </AppShell>
  );
}
