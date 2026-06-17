import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { getPendingItems, isCurrentUserAdmin, listUsers } from "@/lib/items";
import { createClient } from "@/lib/supabase/server";
import {
  approveGear,
  rejectGear,
  setUserAdmin,
  deleteUser,
} from "@/app/actions/admin";

export const metadata: Metadata = {
  title: "Admin — Moderation",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isCurrentUserAdmin())) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const myId = user?.id ?? null;

  const [pending, users] = await Promise.all([getPendingItems(), listUsers()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Moderation queue</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gear submissions awaiting approval. Approving makes an item public; rejecting
            keeps it hidden.
          </p>
        </header>

        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing pending. All caught up.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 p-3"
              >
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={`${item.title} product image`}
                    width={56}
                    height={56}
                    className="rounded"
                    unoptimized
                  />
                ) : (
                  <div className="h-14 w-14 rounded bg-zinc-800" />
                )}

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${item.type}/${item.slug}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="truncate text-sm text-zinc-400">
                    <span className="capitalize">{item.type}</span>
                    {item.manufacturer && ` · ${item.manufacturer}`}
                    {item.price !== null && ` · $${item.price}`}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Submitted by {item.submitter ?? "unknown"} ·{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={approveGear.bind(null, item.id, item.type, item.slug)}>
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectGear.bind(null, item.id, item.type, item.slug)}>
                    <button
                      type="submit"
                      className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        </section>

        <section className="flex flex-col gap-4">
          <header>
            <h2 className="text-xl font-bold tracking-tight">Users</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Grant or revoke admin, or delete accounts. You can&apos;t change or delete your
              own admin status here.
            </p>
          </header>

          <ul className="flex flex-col gap-2">
            {users.map((u) => {
              const isSelf = u.id === myId;
              return (
                <li
                  key={u.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {u.display_name ?? u.email ?? "unknown"}
                      {u.is_admin && (
                        <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-xs font-normal text-amber-300">
                          admin
                        </span>
                      )}
                      {isSelf && <span className="text-xs text-zinc-500">(you)</span>}
                    </p>
                    <p className="truncate text-sm text-zinc-400">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isSelf && (
                      <form action={setUserAdmin.bind(null, u.id, !u.is_admin)}>
                        <button
                          type="submit"
                          className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                        >
                          {u.is_admin ? "Revoke admin" : "Make admin"}
                        </button>
                      </form>
                    )}
                    {!isSelf && (
                      <form action={deleteUser.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
