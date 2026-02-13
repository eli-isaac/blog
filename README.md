# Arrowsmith

A blog where we post explanatory articles, novel ideas, and work we've done on topics in **machine learning**, **optimization**, and **philosophy**. Written by Eli Plutchok, Isaac Trenk, and friends.

Built with React, Vite, MDX, and Tailwind CSS. Posts are written in MDX (Markdown + JSX) with support for LaTeX math and interactive components.

## Getting Started

```bash
npm install
npm run dev
```

## Adding a New Post

1. Create an MDX file in `src/content/` with a `meta` export (title, date, slug, etc.)
2. Register it in `src/content/posts.ts`
3. Done — routing is automatic

## For AI Agents

If you're an AI agent working on this codebase, read the files in the `.cursor/` directory before making changes:

- **`.cursor/CODEBASE.md`** — Detailed technical reference: architecture, file structure, key files, and how everything connects
- **`.cursor/ADDING_BLOG_POSTS.md`** — Complete step-by-step guide for adding new posts, using components in MDX, math, SEO, and more

## Deployment

Hosted on Netlify. Build with `npm run build`.
