import { ComponentType, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import type { MDXComponents } from 'mdx/types'
import { posts } from '../content/posts'
import { PostPreview, PostPreviewModal } from './PostPreview'

export default function Posts() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
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
          {posts.map((post, index) => (
            <li key={post.meta.slug}>
              <PostPreview
                meta={post.meta}
                onExpand={() => setActiveSlug(post.meta.slug)}
                onNavigate={() => navigate(`/posts/${post.meta.slug}`)}
              />
              {index < posts.length - 1 && (
                <div className="mx-8 border-b border-gray-200/60" />
              )}
            </li>
          ))}
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
