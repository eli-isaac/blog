/**
 * Post-build script — runs after `vite build`.
 *
 * 1. Generates per-post HTML files with correct OG meta tags + Article JSON-LD
 * 2. Generates per-post content.md files (plain markdown for AI agents)
 * 3. Generates sitemap.xml
 * 4. Generates llms.txt (site index for AI agents)
 *
 * Social media crawlers don't execute JavaScript, so they never see the
 * dynamic meta tags set by useDocumentMeta in React. This script creates
 * a static HTML file for each blog post route with the correct tags baked in.
 * Netlify serves these static files before the SPA rewrite rule.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const siteUrl = 'https://arrowsmith.ai'

// ---------------------------------------------------------------------------
// 1. Extract post metadata + raw content from MDX files
// ---------------------------------------------------------------------------
const contentDir = join(root, 'src', 'content')
const mdxFiles = readdirSync(contentDir).filter(f => f.endsWith('.mdx'))

const posts = []
for (const file of mdxFiles) {
  const raw = readFileSync(join(contentDir, file), 'utf-8')
  const metaMatch = raw.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/)
  if (metaMatch) {
    try {
      const meta = new Function(`return ${metaMatch[1]}`)()
      posts.push({ ...meta, _raw: raw })
    } catch {
      console.warn(`  ⚠ Could not parse meta in ${file}, skipping`)
    }
  }
}

// ---------------------------------------------------------------------------
// Helper: convert MDX source to clean readable markdown
// ---------------------------------------------------------------------------
function mdxToMarkdown(raw, meta) {
  let md = raw
    // Remove the export const meta = { ... } block
    .replace(/export\s+const\s+meta\s*=\s*\{[\s\S]*?\n\}\s*/, '')
    // Remove import statements
    .replace(/^import\s+.*$/gm, '')
    // Convert <Cite authors="X" year="Y" url="Z" /> to [X, Y](Z)
    .replace(/<Cite\s+authors="([^"]+)"\s+year="([^"]+)"\s+url="([^"]+)"\s*\/>/g, '[$1, $2]($3)')
    // Remove self-closing JSX component tags (e.g. <NeuralNetworkDemo />, <ActivationGraph ... />)
    .replace(/^<[A-Z][A-Za-z]*\s[^>]*\/>\s*$/gm, '')
    .replace(/^<[A-Z][A-Za-z]*\s*\/>\s*$/gm, '')
    // Remove HTML anchor tags used for in-page linking (e.g. <a id="..." />)
    .replace(/^<a\s+id="[^"]*"\s*\/>\s*$/gm, '')
    // Convert relative image paths to absolute URLs
    .replace(/!\[([^\]]*)\]\(\//g, `![$1](${siteUrl}/`)
    // Clean up excessive blank lines (3+ → 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Build a header
  const authors = meta.authors?.join(', ') || ''
  const header = [
    `# ${meta.title}`,
    meta.subtitle ? `### ${meta.subtitle}` : '',
    '',
    [authors, meta.date].filter(Boolean).join(' — '),
    `${siteUrl}/posts/${meta.slug}`,
  ].filter(line => line !== '').join('\n')

  return `${header}\n\n---\n\n${md}\n`
}

// ---------------------------------------------------------------------------
// 2. Read the built index.html template
// ---------------------------------------------------------------------------
const indexHtml = readFileSync(join(root, 'dist', 'index.html'), 'utf-8')

// ---------------------------------------------------------------------------
// 3. Generate per-post HTML with correct meta tags + JSON-LD
// ---------------------------------------------------------------------------
for (const post of posts) {
  const pageTitle = `${post.title} — Arrowsmith`
  const description = post.subtitle || post.title
  const authors = post.authors || []
  const authorStr = authors.join(', ')
  const fullDesc = `${description}${authorStr ? ` — by ${authorStr}` : ''}`
  const postUrl = `${siteUrl}/posts/${post.slug}`

  // Article JSON-LD
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': fullDesc,
    'url': postUrl,
    'datePublished': post.date,
    'author': authors.map(name => ({ '@type': 'Person', 'name': name })),
    'publisher': {
      '@type': 'Organization',
      'name': 'Arrowsmith',
      'url': siteUrl,
      'logo': { '@type': 'ImageObject', 'url': `${siteUrl}/arrowsmith.png` }
    },
    'image': `${siteUrl}/arrowsmith.png`,
    'mainEntityOfPage': { '@type': 'WebPage', '@id': postUrl }
  })

  const html = indexHtml
    .replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`)
    .replace(
      /(<link rel="canonical" href=").*?(")/,
      `$1${postUrl}$2`
    )
    .replace(
      /(<meta name="description" content=").*?(")/,
      `$1${fullDesc}$2`
    )
    .replace(
      /(<meta property="og:type" content=").*?(")/,
      `$1article$2`
    )
    .replace(
      /(<meta property="og:title" content=").*?(")/,
      `$1${pageTitle}$2`
    )
    .replace(
      /(<meta property="og:description" content=").*?(")/,
      `$1${fullDesc}$2`
    )
    .replace(
      /(<meta property="og:url" content=").*?(")/,
      `$1${postUrl}$2`
    )
    .replace(
      /(<meta name="twitter:title" content=").*?(")/,
      `$1${pageTitle}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=").*?(")/,
      `$1${fullDesc}$2`
    )
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${jsonLd}</script>`
    )

  const dir = join(root, 'dist', 'posts', post.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)

  // Write clean markdown version for AI agents
  writeFileSync(join(dir, 'content.md'), mdxToMarkdown(post._raw, post))

  console.log(`  ✓ /posts/${post.slug}/`)
}

console.log(`Generated meta pages for ${posts.length} post(s)`)

// ---------------------------------------------------------------------------
// 4. Generate sitemap.xml
// ---------------------------------------------------------------------------
const today = new Date().toISOString().split('T')[0]

const staticPages = [
  { loc: '', changefreq: 'weekly', priority: '1.0' },
  { loc: '/posts', changefreq: 'weekly', priority: '0.8' },
  { loc: '/about', changefreq: 'monthly', priority: '0.5' },
]

const urls = [
  ...staticPages.map(p => `
  <url>
    <loc>${siteUrl}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
  ...posts.map(p => `
  <url>
    <loc>${siteUrl}/posts/${p.slug}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>
`

writeFileSync(join(root, 'dist', 'sitemap.xml'), sitemap)
console.log('Generated sitemap.xml')

// ---------------------------------------------------------------------------
// 5. Generate llms.txt
// ---------------------------------------------------------------------------
const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date))

const postEntries = sortedPosts.map(p => {
  const authors = p.authors?.join(', ') || ''
  return [
    `- [${p.title}](${siteUrl}/posts/${p.slug}): ${p.subtitle || p.title}`,
    `  - Authors: ${authors || 'Unknown'}`,
    `  - Date: ${p.date}`,
    `  - Full text (markdown): ${siteUrl}/posts/${p.slug}/content.md`,
  ].join('\n')
}).join('\n\n')

const llmsTxt = `# Arrowsmith

> Explanatory articles and novel ideas on machine learning, optimization, and philosophy.

Site: ${siteUrl}
Authors: Eli Plutchok, Isaac Trenk

## About This File

This file helps AI agents and LLMs navigate and read Arrowsmith content.
The site is a JavaScript single-page app, so fetching HTML pages will not
return article text. Use the markdown links below to read full articles.

## How to Read Articles

Each article has a plain markdown version at:
  ${siteUrl}/posts/<slug>/content.md

These files contain the complete article text in clean markdown (no JavaScript
required). Fetch only the articles you need — do not download all of them at once.

## Articles

${postEntries}

## Other Pages

- [All Posts](${siteUrl}/posts): Full list of articles
- [About](${siteUrl}/about): About the blog and its authors
- [Sitemap](${siteUrl}/sitemap.xml): XML sitemap for crawlers
`

writeFileSync(join(root, 'dist', 'llms.txt'), llmsTxt)
console.log('Generated llms.txt')
