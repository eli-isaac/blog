# Isaac's Ram

A minimalist blog and portfolio built with React, Vite, and MDX.

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── content/                    # MDX blog posts
│   └── activation-functions.mdx
├── components/
│   ├── MDXPost.jsx             # Post layout + component injection
│   ├── Posts.jsx               # Posts list (reads from MDX metadata)
│   └── ...
├── pages/
│   ├── Home.jsx
│   └── About.jsx
└── App.jsx                     # Routes
```

## Adding a New Post

### 1. Create the MDX file

Create `src/content/my-new-post.mdx`:

```mdx
export const meta = {
  title: "My New Post",
  subtitle: "A brief description",
  date: "2025-12-26",
  authors: ["Your Name"],
  slug: "my-new-post"
}

## Introduction

Your content here. You can use **markdown** and math:

$$E = mc^2$$

And custom React components:

<ActivationGraph type="sigmoid" />
```

### 2. Add the route

In `src/App.jsx`, add the import and route:

```jsx
// Add import at the top
import MyNewPostContent, { meta as myNewPostMeta } from './content/my-new-post.mdx'

// Add route inside <Routes>
<Route 
  path="/posts/my-new-post" 
  element={<MDXPost meta={myNewPostMeta} Content={MyNewPostContent} />} 
/>
```

### 3. Add to posts list

In `src/components/Posts.jsx`:

```jsx
// Add import
import { meta as myNewPost } from '../content/my-new-post.mdx'

// Add to posts array
const posts = [
  activationFunctions,
  myNewPost,  // ← add here
]
```

## Using Components in MDX

### Global components (available in all posts)

Components in `MDXPost.jsx` are available everywhere without importing:

- `<ActivationGraph type="sigmoid" />`
- `<NeuralNetworkDemo />`
- `<Reference>Citation here</Reference>`

To add a new global component, add it to the `components` object in `src/components/MDXPost.jsx`.

### One-off components

Import directly in the MDX file:

```mdx
import MySpecialWidget from '../components/MySpecialWidget'

<MySpecialWidget />
```

## Math

- Inline math: `$x^2$`
- Block math (centered): `$$E = mc^2$$`

## Deployment

Configured for Netlify. The `public/_redirects` file handles SPA routing.

```bash
npm run build
```
