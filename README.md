# This or That with Bhartendra

Landing page for the podcast **This or That with Bhartendra** — *Beyond the noise*.

Built with Next.js 14 (App Router) and Tailwind CSS. Episodes are pulled live from the [YouTube channel](https://www.youtube.com/@ThisOrThatPodcastIndia) via the public RSS feed, so the page stays up to date without manual edits.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
npm start
```

## Configuration

The page resolves the YouTube channel ID automatically from the handle `@ThisOrThatPodcastIndia`. If you want to skip that lookup (e.g. for faster cold starts or stricter networks), set:

```
YOUTUBE_CHANNEL_ID=UC...
```

in a `.env.local` file. The ID can be found by visiting the channel page → View Source → search for `"channelId"`.

## Deploy

Deploys cleanly to Vercel, Netlify, or any Node host that supports Next.js 14. The page uses ISR (`revalidate = 1800`), so the YouTube feed is refreshed at most every 30 minutes.

## Sections

- **Hero** — tagline, latest episode card, channel CTA.
- **This or That** — interactive warm-up that mirrors the show's format.
- **Episodes** — auto-populated grid of the most recent uploads.
- **About** — the host's bio and background.
- **Subscribe** — platform links plus email signup (front-end only — wire it to your provider of choice in `components/Subscribe.tsx`).
