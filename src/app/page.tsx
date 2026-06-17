import AppShell from "@/components/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">The sound compass</h1>
        <p className="text-zinc-300">
          MusicCompas maps music and audio gear on two axes — <strong>treble ↔ bass</strong> and{" "}
          <strong>technical ↔ atmospheric</strong>. Vote on where something sits, see the
          community consensus, and discover items that sound alike.
        </p>

        <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
          <div className="col-span-3">Treble</div>
          <div className="text-right">Technical</div>
          <div className="aspect-square w-40 justify-self-center rounded-lg border border-dashed border-zinc-700" />
          <div className="text-left">Atmospheric</div>
          <div className="col-span-3">Bass</div>
        </div>

        <p className="text-sm text-zinc-500">
          Search for an album in the sidebar to open its compass and place your vote.
        </p>
      </div>
    </AppShell>
  );
}
