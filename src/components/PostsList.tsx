import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { posts } from '../content/posts'
import { PostPreview } from './PostPreview'

const previewBg = '#e5e5d3'

export default function PostsList() {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const navigate = useNavigate()

  // Ref for the <ul> container so we can measure relative positions
  const listRef = useRef<HTMLUListElement>(null)
  // Refs for each post <li> element keyed by slug
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map())

  const setItemRef = useCallback((slug: string, el: HTMLLIElement | null) => {
    if (el) itemRefs.current.set(slug, el)
    else itemRefs.current.delete(slug)
  }, [])

  // Compute the top/height of the hovered item relative to the <ul>
  const getHighlightStyle = () => {
    if (!hoveredSlug || !listRef.current) return null
    const item = itemRefs.current.get(hoveredSlug)
    if (!item) return null
    const listRect = listRef.current.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    return {
      top: itemRect.top - listRect.top,
      height: itemRect.height,
    }
  }

  const highlight = getHighlightStyle()

  return (
    <div className="pt-12 md:pt-24 max-w-xl px-6 mx-auto md:mx-0 md:ml-[20%] md:px-0">
        <ul ref={listRef} className="relative">
          {/* Single sliding highlight background */}
          <AnimatePresence>
            {hoveredSlug && highlight && (
              <motion.div
                key="post-hover-highlight"
                className="pointer-events-none absolute left-0 right-0 rounded-3xl"
                style={{ backgroundColor: previewBg }}
                initial={{ opacity: 0, y: highlight.top, height: highlight.height }}
                animate={{ opacity: 1, y: highlight.top, height: highlight.height }}
                exit={{ opacity: 0 }}
                transition={{
                  y: { type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
                  height: { type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
                  opacity: { duration: 0.15 },
                }}
              />
            )}
          </AnimatePresence>

          {posts.map((post, index) => {
            // Hide divider if the post above or below is hovered
            const isAdjacentToHover =
              hoveredSlug === post.meta.slug ||
              (index < posts.length - 1 && hoveredSlug === posts[index + 1].meta.slug)

            return (
              <li
                key={post.meta.slug}
                ref={(el) => setItemRef(post.meta.slug, el)}
                className="relative"
                onMouseEnter={() => setHoveredSlug(post.meta.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
              >
                <PostPreview
                  meta={post.meta}
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
  )
}
