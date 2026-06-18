import type { Item } from "@/lib/types";
import { streamingLinks } from "@/lib/streaming";

/** Row of "listen on" links to the major streaming services. */
export default function StreamingLinks({ item }: { item: Item }) {
  const links = streamingLinks(item);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Listen on
      </p>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.service}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:border-indigo-500 hover:text-indigo-400"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
