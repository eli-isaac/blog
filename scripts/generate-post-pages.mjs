/**
 * Post-build script — runs after `vite build`.
 *
 * 1. Generates per-post HTML files with correct OG meta tags + Article JSON-LD
 * 2. Generates sitemap.xml
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
// 1. Extract post metadata from MDX files
// ---------------------------------------------------------------------------
const contentDir = join(root, 'src', 'content')
const mdxFiles = readdirSync(contentDir).filter(f => f.endsWith('.mdx'))

const posts = []
for (const file of mdxFiles) {
  const content = readFileSync(join(contentDir, file), 'utf-8')
  const metaMatch = content.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/)
  if (metaMatch) {
    try {
      const meta = new Function(`return ${metaMatch[1]}`)()
      posts.push(meta)
    } catch {
      console.warn(`  ⚠ Could not parse meta in ${file}, skipping`)
    }
  }
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
    // <title>
    .replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`)
    // Canonical
    .replace(
      /(<link rel="canonical" href=").*?(")/,
      `$1${postUrl}$2`
    )
    // Meta description
    .replace(
      /(<meta name="description" content=").*?(")/,
      `$1${fullDesc}$2`
    )
    // OG tags
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
    // Twitter Card tags
    .replace(
      /(<meta name="twitter:title" content=").*?(")/,
      `$1${pageTitle}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=").*?(")/,
      `$1${fullDesc}$2`
    )
    // Replace the WebSite JSON-LD with Article JSON-LD
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${jsonLd}</script>`
    )

  const dir = join(root, 'dist', 'posts', post.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
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
