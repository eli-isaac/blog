# Adding Blog Posts to Arrowsmith

Complete guide for AI agents (and humans) to add new blog posts.

## Quick Start (3 steps)

### Step 1: Create the MDX file

Create a new file at `src/content/<your-slug>.mdx`.

Every MDX file **must** begin with a `meta` export:

```mdx
export const meta = {
  title: "Your Post Title",
  subtitle: "A short description shown in previews and used for SEO",
  date: "2026-02-13",
  authors: ["Author One", "Author Two"],
  slug: "your-post-slug"
}

## First Heading

Your content here...
```

**Field details:**

| Field      | Required | Description                                                        |
|------------|----------|--------------------------------------------------------------------|
| `title`    | Yes      | Main heading. Shows in post header, preview cards, and browser tab |
| `subtitle` | No       | Short tagline. Shown below the title and used as SEO description   |
| `date`     | Yes      | Publication date in `YYYY-MM-DD` format                            |
| `authors`  | No       | Array of author names. Shown joined with `&` in the header         |
| `slug`     | Yes      | URL path segment. Post will be at `/posts/<slug>`                  |
| `description` | No    | Optional longer SEO description. Falls back to `subtitle` if omitted |

### Step 2: Register the post

Open `src/content/posts.ts` and:

1. Add the import at the top:
```typescript
import YourPostContent, { meta as yourPostMeta } from './your-slug.mdx'
```

2. Add an entry to the `posts` array:
```typescript
export const posts: Post[] = [
  // ... existing posts
  {
    meta: yourPostMeta,
    Content: YourPostContent,
  },
]
```

**That's it.** The routing is automatic — `App.tsx` iterates over the `posts` array and creates a route for each.

### Step 3: Verify

Run `npm run dev` and navigate to `/posts/<your-slug>` to confirm everything renders.

---

## Writing Content in MDX

MDX is Markdown with JSX support. You can use all standard Markdown features plus React components.

### Standard Markdown

```mdx
## Heading 2
### Heading 3

Regular paragraph with **bold** and *italic* text.

- Bullet list
- Another item

1. Numbered list
2. Another item

[Link text](https://example.com)
```

### Math (LaTeX via KaTeX)

Inline math uses single dollar signs: `$E = mc^2$`

Block math uses double dollar signs (auto-centered):

```mdx
$$\frac{\partial L}{\partial w} = \nabla_w L$$
```

KaTeX is configured via `remark-math` and `rehype-katex` in `vite.config.ts`.

### Images

Place images in the `public/` folder and reference them with absolute paths:

```mdx
![Alt text](/images/my-diagram.png)
```

---

## Using Components in MDX

### Global components (available in every post without importing)

These are registered in `src/components/MDXPost.tsx` in the `mdxComponents` object:

| Component                          | Description                                                       |
|------------------------------------|-------------------------------------------------------------------|
| `<ActivationGraph type="sigmoid" />` | Plots activation functions (step, sigmoid, tanh, relu, leakyRelu, gelu) |
| `<NeuralNetworkDemo />`            | Interactive neural network training demo                          |
| `<Cite authors="Name" year="2024" url="https://..." />` | Inline citation link                    |

The styled HTML overrides (`h2`, `h3`, `p`, `ul`, `ol`, etc.) are also defined there.

### Adding a new global component

1. Create or import your component in `src/components/MDXPost.tsx`
2. Add it to the `mdxComponents` object:
```typescript
export const mdxComponents: MDXComponents = {
  // ... existing components
  MyNewComponent,
}
```
3. Now use `<MyNewComponent />` in any MDX file without importing.

### One-off components (post-specific)

Import directly at the top of the MDX file (below the meta export):

```mdx
export const meta = { ... }

import MyWidget from '../components/MyWidget'

## Content

<MyWidget prop="value" />
```

---

## Post Meta & SEO

Each post automatically gets:
- **Browser title**: `"Post Title — Arrowsmith"` (via `useDocumentMeta` hook in `MDXPost.tsx`)
- **Meta description**: Uses `description` field, falls back to `subtitle`, then `title`
- **Open Graph tags**: `og:title`, `og:description`, `og:type=article`
- **Twitter Card tags**: mirrors OG

To improve SEO for a post, provide a descriptive `subtitle` (or `description` in the meta).

---

## Styling Notes

- The blog uses **Tailwind CSS v4** (configured via `@tailwindcss/vite` plugin)
- Base font: **Outfit** (loaded from Google Fonts in `index.html`)
- Background color: `#efefe2`
- Post body max-width is constrained to `max-w-xl` in `PostPage.tsx`
- MDX HTML elements are styled via the overrides in `MDXPost.tsx` (not Tailwind `@apply` — they use inline className strings)

---

## Common Patterns

### Adding a new interactive visualization

1. Create the component in `src/components/`
2. Register it as a global MDX component in `MDXPost.tsx` (or import it directly in the MDX file)
3. Use it in your MDX content

### Changing post order

Posts appear in the order they're listed in the `posts` array in `src/content/posts.ts`. Reorder the array to change display order.

### Adding a new author

Authors are just strings in the `authors` array — no separate author config needed. Just add the name.

---

## Checklist for a New Post

- [ ] Created `src/content/<slug>.mdx` with proper `meta` export
- [ ] Registered in `src/content/posts.ts` (import + array entry)
- [ ] Verified it renders at `/posts/<slug>`
- [ ] Math renders correctly (if used)
- [ ] Custom components work (if used)
- [ ] Subtitle is descriptive (for SEO)
