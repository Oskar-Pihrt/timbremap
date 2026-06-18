import type { Item } from "./types";

export type StreamingService =
  | "tidal"
  | "spotify"
  | "apple"
  | "youtube"
  | "deezer";

export interface StreamingLink {
  service: StreamingService;
  label: string;
  url: string;
}

const SERVICE_LABELS: Record<StreamingService, string> = {
  tidal: "Tidal",
  spotify: "Spotify",
  apple: "Apple Music",
  youtube: "YouTube Music",
  deezer: "Deezer",
};

/** Build a search query from an item's title + artist/manufacturer. */
function searchQuery(item: Item): string {
  const who =
    item.type === "headphones" || item.type === "iem" || item.type === "speaker"
      ? item.manufacturer
      : item.artist;
  return [who, item.title].filter(Boolean).join(" ");
}

/** Search URLs by service. Deezer is overridden with a direct link when known. */
function searchUrl(service: StreamingService, query: string): string {
  const q = encodeURIComponent(query);
  switch (service) {
    case "tidal":
      return `https://tidal.com/search?q=${q}`;
    case "spotify":
      return `https://open.spotify.com/search/${q}`;
    case "apple":
      return `https://music.apple.com/search?term=${q}`;
    case "youtube":
      return `https://music.youtube.com/search?q=${q}`;
    case "deezer":
      return `https://www.deezer.com/search/${q}`;
  }
}

/**
 * Links to the item on each major streaming service. Deezer resolves to a direct
 * deep link when we have the imported Deezer id; everything else (and Deezer for
 * non-imported items) is a pre-filled search by artist/manufacturer + title.
 */
export function streamingLinks(item: Item): StreamingLink[] {
  const order: StreamingService[] = [
    "tidal",
    "spotify",
    "apple",
    "youtube",
    "deezer",
  ];
  const query = searchQuery(item);

  return order.map((service) => {
    let url = searchUrl(service, query);
    if (
      service === "deezer" &&
      item.external_source === "deezer" &&
      item.external_id
    ) {
      const path = item.type === "song" ? "track" : "album";
      url = `https://www.deezer.com/${path}/${item.external_id}`;
    }
    return { service, label: SERVICE_LABELS[service], url };
  });
}
