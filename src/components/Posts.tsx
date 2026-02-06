import { ComponentType, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import type { MDXComponents } from 'mdx/types'
import { posts } from '../content/posts'
import { PostPreview, PostPreviewModal } from './PostPreview'

export default function Posts() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const navigate = useNavigate()

  const activePost = posts.find((post) => post.meta.slug === activeSlug) || null

  const handleOpenArticle = (slug: string) => {
    // Allow Framer to measure the shared element before navigating
    requestAnimationFrame(() => navigate(`/posts/${slug}`))
  }

  return (
    <LayoutGroup>
      <div className="pt-24 max-w-xl px-6 mx-auto md:mx-0 md:ml-[20%] md:px-0">
        <ul>
          {posts.map((post, index) => {
            // Hide divider if the post above or below is hovered
            const isAdjacentToHover =
              hoveredSlug === post.meta.slug ||
              (index < posts.length - 1 && hoveredSlug === posts[index + 1].meta.slug)

            return (
              <li
                key={post.meta.slug}
                onMouseEnter={() => setHoveredSlug(post.meta.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
              >
                <PostPreview
                  meta={post.meta}
                  onExpand={() => setActiveSlug(post.meta.slug)}
                  onNavigate={() => navigate(`/posts/${post.meta.slug}`)}
                />
                {index < posts.length - 1 && (
                  <div
                    className="mx-8 border-b border-stone-300/50 transition-opacity duration-200"
                    style={{ opacity: isAdjacentToHover ? 0 : 1 }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <AnimatePresence>
        {activePost && (
          <PostPreviewModal
            key={activePost.meta.slug}
            meta={activePost.meta}
            Content={activePost.Content as unknown as ComponentType<{ components?: MDXComponents }>}
            onClose={() => setActiveSlug(null)}
            onOpenArticle={() => handleOpenArticle(activePost.meta.slug)}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}
