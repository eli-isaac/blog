/**
 * Post-build script: generates per-post HTML files with correct OG meta tags.
 *
 * Social media crawlers (Twitter, Facebook, etc.) don't execute JavaScript,
 * so they never see the dynamic meta tags set by useDocumentMeta in React.
 * This script creates a static HTML file for each blog post route with the
 * correct title, description, and image tags baked in. Netlify serves these
 * static files before falling through to the SPA rewrite rule.
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
  // Match the meta export block (simple object literal)
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
// 3. Generate per-post HTML with correct meta tags
// ---------------------------------------------------------------------------
for (const post of posts) {
  const pageTitle = `${post.title} — Arrowsmith`
  const description = post.subtitle || post.title
  const authors = post.authors?.join(', ') || ''
  const fullDesc = `${description}${authors ? ` — by ${authors}` : ''}`
  const postUrl = `${siteUrl}/posts/${post.slug}`

  const html = indexHtml
    // <title>
    .replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`)
    // meta description
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

  const dir = join(root, 'dist', 'posts', post.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
  console.log(`  ✓ /posts/${post.slug}/`)
}

console.log(`\nGenerated OG meta pages for ${posts.length} post(s)`)
