import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import GearForm from "@/components/GearForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Submit gear",
  robots: { index: false, follow: false },
};

export default async function SubmitGearPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submit gear</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Add a pair of headphones, IEMs, or a speaker to the compass. It goes live
            immediately — anyone can then place it on the sound map.
          </p>
        </div>
        <GearForm />
      </div>
    </AppShell>
  );
}
