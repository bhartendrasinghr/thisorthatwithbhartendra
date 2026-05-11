import type { Episode } from "./types";

const YOUTUBE_HANDLE = "ThisOrThatPodcastIndia";
const REVALIDATE_SECONDS = 60 * 30;

const FALLBACK_EPISODES: Episode[] = [
  {
    id: "placeholder-1",
    title: "New episodes coming soon",
    description:
      "Episodes will appear here automatically once the YouTube channel is reachable from the deployment.",
    thumbnail: "",
    publishedAt: new Date().toISOString(),
    url: `https://www.youtube.com/@${YOUTUBE_HANDLE}`
  }
];

async function resolveChannelId(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@${handle}`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
      },
      next: { revalidate: 60 * 60 * 24 }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/"channelId":"(UC[\w-]+)"/) ||
      html.match(/<meta itemprop="channelId" content="(UC[\w-]+)"/) ||
      html.match(/"externalId":"(UC[\w-]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function pickTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(re);
  return match ? stripCdata(match[1]) : "";
}

function parseEntries(xml: string): Episode[] {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/g) ?? [];
  return entries.map((entry) => {
    const id = pickTag(entry, "yt:videoId");
    const title = pickTag(entry, "title");
    const published = pickTag(entry, "published");
    const description = pickTag(entry, "media:description");
    const thumbMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);
    const thumbnail = thumbMatch
      ? thumbMatch[1]
      : id
        ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
        : "";
    return {
      id,
      title,
      description,
      thumbnail,
      publishedAt: published,
      url: `https://www.youtube.com/watch?v=${id}`
    } satisfies Episode;
  });
}

export async function getEpisodes(): Promise<Episode[]> {
  const explicitId = process.env.YOUTUBE_CHANNEL_ID;
  const channelId = explicitId || (await resolveChannelId(YOUTUBE_HANDLE));
  if (!channelId) return FALLBACK_EPISODES;
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!res.ok) return FALLBACK_EPISODES;
    const xml = await res.text();
    const episodes = parseEntries(xml);
    return episodes.length ? episodes : FALLBACK_EPISODES;
  } catch {
    return FALLBACK_EPISODES;
  }
}

export const CHANNEL_URL = `https://www.youtube.com/@${YOUTUBE_HANDLE}`;
