# Arrowsmith — SEO Reference

This document explains every SEO-related mechanism in the codebase: what it does, where it lives, and how to maintain it.

## The SPA Problem

Arrowsmith is a React single-page application. All routes serve the same `index.html`, and page content (including meta tags) is rendered client-side by JavaScript. This is fine for users with browsers, but **search engine crawlers and social media scrapers** (Twitter, Facebook, Slack, etc.) often don't execute JavaScript. They read only the raw HTML the server returns.

Without intervention, every page on the site would look identical to crawlers — the same generic title, description, and image. The solutions below address this at two levels:

1. **Build-time static generation** — the post-build script creates per-route HTML files with the correct meta tags baked in, so crawlers see the right data without needing JavaScript.
2. **Client-side dynamic tags** — the `useDocumentMeta` hook updates tags at runtime for in-browser SEO (e.g. if a user navigates between pages and the browser tab title should update).

---

## Architecture Overview

```
index.html                          ← Static defaults (homepage)
  ↓ Vite build
dist/index.html                     ← Production HTML shell
  ↓ generate-post-pages.mjs (post-build)
dist/posts/<slug>/index.html        ← Per-post HTML with correct meta
dist/sitemap.xml                    ← Auto-generated sitemap

Netlify serves:
  /posts/drop-loss → dist/posts/drop-loss/index.html  (static file exists)
  /some-other-path → dist/index.html                  (SPA fallback via _redirects)
```

Netlify serves static files first. If `dist/posts/drop-loss/index.html` exists, it is returned for `/posts/drop-loss`. The `_redirects` rule (`/* /index.html 200`) only applies when no matching file exists. This means crawlers get post-specific HTML, while the SPA still works for all routes.

---

## File-by-File Reference

### `index.html` — Static Defaults

The HTML shell that Vite uses as its entry point. Contains all default/homepage SEO tags.

| Tag | Purpose |
|-----|---------|
| `<meta charset="UTF-8">` | Character encoding declaration |
| `<meta name="viewport" ...>` | Mobile responsiveness |
| `<link rel="icon" ...>` | Favicon (32x32 PNG) |
| `<link rel="apple-touch-icon" ...>` | iOS home screen icon |
| `<link rel="canonical" ...>` | Canonical URL — tells search engines this is the authoritative URL for the page, preventing duplicate content issues |
| `<link rel="preconnect" ...>` | DNS preconnection to Google Fonts (reduces latency) |
| `<title>` | Browser tab title; used by search engines as the page title in results |
| `<meta name="description">` | Shown as the snippet below the title in search results |
| `<meta name="robots" content="index, follow">` | Tells crawlers to index the page and follow links |
| `<meta name="author">` | Author attribution |
| `<meta property="og:*">` | Open Graph tags for Facebook, LinkedIn, Slack, etc. |
| `<meta property="og:image:alt">` | Alt text for the OG image (accessibility + SEO) |
| `<meta property="og:locale">` | Language/region for the content |
| `<meta name="twitter:*">` | Twitter Card tags (controls how links appear when shared on Twitter) |
| `<meta name="twitter:image:alt">` | Alt text for the Twitter card image |
| `<script type="application/ld+json">` | Structured data — see [JSON-LD section](#json-ld-structured-data) |

**When to edit:** Update this file when changing the site name, default description, site URL, favicon, or default OG image.

### `src/hooks/useDocumentMeta.ts` — Client-Side Dynamic Tags

A React hook that updates meta tags at runtime when users navigate between pages. Every page component calls this hook.

**What it manages:**
- `document.title` — set to `"Page Title — Arrowsmith"`
- `<meta name="description">` — page-specific description
- `<meta property="og:title">`, `og:description`, `og:type`, `og:url` — Open Graph tags
- `<meta name="twitter:title">`, `twitter:description` — Twitter Card tags
- `<link rel="canonical">` — updates canonical URL based on current route

**Important:** These dynamic updates only affect in-browser behavior. Crawlers that don't run JS will never see them — that's what the build-time generation handles.

**Constants defined here:**
- `SITE_URL` = `'https://arrowsmith.ai'` — used to construct canonical URLs and OG URLs
- `DEFAULT_DESC` — the default description restored on unmount

**When to edit:** If you change the site URL, update `SITE_URL` here. If you add new meta tag types (e.g. `article:published_time`), add them to this hook.

### `scripts/generate-post-pages.mjs` — Build-Time Meta Generation

Runs automatically after `vite build` (configured in `package.json`). Does two things:

#### Per-Post HTML Generation
1. Scans all `src/content/*.mdx` files
2. Extracts the `export const meta = { ... }` block from each using regex
3. Reads the built `dist/index.html` as a template
4. For each post, creates `dist/posts/<slug>/index.html` with:
   - Correct `<title>`
   - Correct `<meta name="description">`
   - Correct `<link rel="canonical">`
   - Correct OG tags (`og:type` set to `article`, correct title/description/URL)
   - Correct Twitter Card tags
   - Article-specific JSON-LD structured data (replaces the homepage WebSite schema)

#### Sitemap Generation
Generates `dist/sitemap.xml` containing:
- All static pages (`/`, `/posts`, `/about`) with today's date
- All blog posts with their publication date from the MDX meta

**Constants defined here:**
- `siteUrl` = `'https://arrowsmith.ai'` — used for all absolute URLs

**When to edit:** If you add new static pages (not blog posts), add them to the `staticPages` array in this script. Blog posts are discovered automatically from MDX files.

### `public/robots.txt` — Crawler Instructions

```
User-agent: *
Allow: /

Sitemap: https://arrowsmith.ai/sitemap.xml
```

Tells all crawlers they're allowed to index everything, and points them to the sitemap.

**When to edit:** If you want to block specific crawlers or paths (e.g. `Disallow: /drafts/`).

### `public/_redirects` — Netlify SPA Routing

```
/*    /index.html   200
```

A catch-all rewrite that makes client-side routing work. Without this, direct-navigating to `/posts/drop-loss` would return a 404 from Netlify (since no file exists at that exact path in a traditional sense).

**Important:** The `200` status (not `200!`) means Netlify serves static files first and only falls through to the rewrite if no file matches. This is what allows the per-post HTML files generated by the build script to work correctly.

### `public/_headers` — HTTP Response Headers

Controls caching and security for all Netlify responses.

| Rule | Effect |
|------|--------|
| `/*` security headers | `X-Frame-Options: DENY` prevents clickjacking; `X-Content-Type-Options: nosniff` prevents MIME sniffing; `Referrer-Policy` controls referrer leakage; `Permissions-Policy` disables unused browser APIs |
| `/assets/*` cache | 1-year immutable cache — safe because Vite hashes all asset filenames |
| `/*.png` cache | 1-week cache for images |
| `/*.html` cache | `must-revalidate` — ensures meta tag updates propagate immediately after deploy |

**When to edit:** If you add new static asset types (e.g. `.webp` images), add appropriate cache rules.

### `src/components/MDXPost.tsx` — Per-Post SEO Hook Call

Each blog post page calls `useDocumentMeta` with:
- `title`: post title
- `description`: subtitle + author
- `ogType`: `'article'`
- `canonicalPath`: `/posts/<slug>`

Also defines the `img` MDX component override with `loading="lazy"` for below-fold image performance.

---

## JSON-LD Structured Data

[JSON-LD](https://json-ld.org/) is a format for embedding structured data that search engines use to understand page content and potentially show rich results (article cards, author info, etc.).

### Homepage — WebSite Schema
Defined in `index.html`:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Arrowsmith",
  "url": "https://arrowsmith.ai",
  "description": "...",
  "author": [
    { "@type": "Person", "name": "Eli Plutchok" },
    { "@type": "Person", "name": "Isaac Trenk" }
  ]
}
```

### Blog Posts — Article Schema
Injected by `generate-post-pages.mjs` (replaces the WebSite schema):
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Drop-Loss",
  "description": "Learn More by Training on Less — by Eli Plutchok",
  "url": "https://arrowsmith.ai/posts/drop-loss",
  "datePublished": "2026-02-14",
  "author": [{ "@type": "Person", "name": "Eli Plutchok" }],
  "publisher": {
    "@type": "Organization",
    "name": "Arrowsmith",
    "url": "https://arrowsmith.ai",
    "logo": { "@type": "ImageObject", "url": "https://arrowsmith.ai/arrowsmith.png" }
  },
  "image": "https://arrowsmith.ai/arrowsmith.png",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://arrowsmith.ai/posts/drop-loss" }
}
```

You can validate structured data at [Google's Rich Results Test](https://search.google.com/test/rich-results) or [Schema.org Validator](https://validator.schema.org/).

---

## Social Sharing (OG + Twitter Cards)

When a link is shared on social media, the platform's crawler fetches the page and reads specific meta tags to build a preview card.

### Open Graph (Facebook, LinkedIn, Slack, Discord, etc.)
| Tag | What it controls |
|-----|-----------------|
| `og:title` | Card title |
| `og:description` | Card description |
| `og:image` | Preview image |
| `og:image:alt` | Alt text for the image |
| `og:url` | Canonical URL shown on the card |
| `og:type` | `website` for homepage, `article` for posts |
| `og:site_name` | Site name shown above the title |
| `og:locale` | Language/region |

### Twitter Cards
| Tag | What it controls |
|-----|-----------------|
| `twitter:card` | Card type — `summary` shows a small square image |
| `twitter:title` | Card title |
| `twitter:description` | Card description |
| `twitter:image` | Preview image |
| `twitter:image:alt` | Alt text for the image |

**Debugging tools:**
- Twitter: [Card Validator](https://cards-dev.twitter.com/validator) (or just share a link in a DM to yourself)
- Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- LinkedIn: [Post Inspector](https://www.linkedin.com/post-inspector/)

**Cache note:** Social platforms cache card data aggressively. After updating meta tags and deploying, you may need to use the debugging tools above to force a re-fetch, or wait for the cache to expire.

---

## Canonical URLs

Every page should have exactly one canonical URL to prevent duplicate content issues (e.g. `/posts/drop-loss` and `/posts/drop-loss/` being treated as separate pages).

- **Static (build-time):** Set via `<link rel="canonical">` in `index.html` and overridden per-post by `generate-post-pages.mjs`
- **Dynamic (client-side):** Updated by `useDocumentMeta` hook based on `canonicalPath` prop or `window.location.pathname`

---

## Sitemap

Auto-generated at build time by `generate-post-pages.mjs` and written to `dist/sitemap.xml`. Referenced by `robots.txt`.

Contains:
- Static pages: `/`, `/posts`, `/about`
- All blog posts discovered from MDX files, with `lastmod` set to their publication date

New blog posts are automatically included — no manual sitemap maintenance needed.

---

## AI Agent Accessibility (llms.txt)

The site is a JavaScript SPA, so AI agents that do simple HTTP fetches (without executing JS) would see an empty `<div id="root"></div>` instead of article content. To solve this, the build script generates plain-text-friendly files:

### `dist/llms.txt` — Site Index for AI Agents

Auto-generated at build time. Lives at `https://arrowsmith.ai/llms.txt`. Contains:
- Site name, description, and authors
- Instructions explaining that the site is a JS SPA and how to read articles
- A list of all articles with title, authors, date, and a direct link to the markdown version

This follows the emerging `llms.txt` convention (similar to `robots.txt` but designed for LLMs).

### `dist/posts/<slug>/content.md` — Per-Article Markdown

Auto-generated at build time for each post. Contains the full article text in clean markdown:
- JSX components (interactive demos, graphs) are stripped out
- `<Cite>` components are converted to `[Author, Year](url)` markdown links
- Image paths are converted to absolute URLs
- Math (LaTeX) is preserved as-is (LLMs understand `$$...$$` notation)
- A clean header with title, subtitle, authors, date, and URL is prepended

**Key design decision:** Articles are available individually at `/posts/<slug>/content.md` rather than bundled into a single file. This lets AI agents fetch only the articles they're interested in, rather than downloading the entire blog at once.

### How It Works for an AI Agent

1. Agent fetches `https://arrowsmith.ai/llms.txt`
2. Sees the list of articles with descriptions
3. Fetches `https://arrowsmith.ai/posts/drop-loss/content.md` to read a specific article
4. Gets clean, complete markdown — no JS execution needed

New posts are automatically included — the build script discovers all MDX files.

---

## Checklist: What to Update When...

### Adding a new blog post
Nothing extra needed. The build script auto-discovers MDX files and generates the correct per-post HTML, sitemap entry, and JSON-LD.

### Adding a new static page
1. Add a route in `App.tsx`
2. Call `useDocumentMeta` in the page component
3. Add the page to the `staticPages` array in `scripts/generate-post-pages.mjs`

### Changing the site URL
Update `siteUrl`/`SITE_URL` in these three places:
1. `index.html` — canonical link, OG/Twitter image URLs
2. `src/hooks/useDocumentMeta.ts` — `SITE_URL` constant
3. `scripts/generate-post-pages.mjs` — `siteUrl` constant

### Changing the default site description
Update in these two places:
1. `index.html` — `<meta name="description">`, OG description, Twitter description, JSON-LD description
2. `src/hooks/useDocumentMeta.ts` — `DEFAULT_DESC` constant

### Changing the OG image
1. Replace the image file in `public/`
2. Update the image URL in `index.html` (both `og:image` and `twitter:image`)
3. The build script inherits from `index.html`, so per-post pages update automatically
