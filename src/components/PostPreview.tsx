import { ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { MDXComponents } from 'mdx/types'
import PostHeader from './PostHeader'
import ArticleBody from './ArticleBody'
import { mdxComponents } from './MDXPost'
import type { PostMeta } from '../content/posts'

const previewBg = 'rgb(245,245,245)'
const hoverTransition = {
  type: 'tween' as const,
  duration: 0.35,
  ease: 'easeOut' as const,
  backgroundColor: { duration: 0.35, ease: 'easeOut' as const },
}

interface PostPreviewProps {
  meta: PostMeta
  onExpand: () => void
  onNavigate: () => void
}

interface PostPreviewModalProps {
  meta: PostMeta
  Content: ComponentType<{ components?: MDXComponents }>
  onClose: () => void
  onOpenArticle: () => void
}

export function PostPreview({ meta, onExpand, onNavigate }: PostPreviewProps) {
  return (
    <motion.article
      layoutId={`post-shell-${meta.slug}`}
      className="group relative overflow-hidden rounded-3xl bg-transparent px-8 py-6 cursor-pointer shadow-none"
      initial={false}
      animate={{ backgroundColor: 'transparent', boxShadow: 'none' }}
      whileHover={{ backgroundColor: previewBg, boxShadow: 'none' }}
      transition={hoverTransition}
      onClick={onNavigate}
    >
      <div className="flex items-start gap-3">
        <PostHeader
          title={meta.title}
          subtitle={meta.subtitle}
          date={meta.date}
          authors={meta.authors}
          slug={meta.slug}
          size="small"
        />
        <div 
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto"
          style={{ isolation: 'isolate', contain: 'layout' }}
        >
          <button
            aria-label="Open preview"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-700 hover:text-red-800 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onExpand()
            }}
          >
            <PreviewIcon />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export function PostPreviewModal({ meta, Content, onClose, onOpenArticle }: PostPreviewModalProps) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop-click-catcher"
        className="fixed inset-0 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="modal"
        layoutId={`post-shell-${meta.slug}`}
        className="fixed left-1/2 top-1/2 z-40 flex h-[70vh] w-[min(800px,88vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{ backgroundColor: previewBg }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1, backgroundColor: previewBg }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'tween', duration: 0.18, ease: 'easeOut', backgroundColor: { duration: 0.18, ease: 'easeOut' } }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 border-b border-gray-100 px-12 py-10">
          <PostHeader
            title={meta.title}
            subtitle={meta.subtitle}
            date={meta.date}
            authors={meta.authors}
            slug={meta.slug}
            size="large"
          />
          <div className="ml-auto flex items-center gap-2">
            <motion.button
              aria-label="Open full article"
              className="inline-flex h-9 items-center justify-center rounded-full bg-red-800 px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-900 cursor-pointer"
              whileHover={{ scale: 1.0 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenArticle}
            >
              Go to article
            </motion.button>
            <motion.button
              aria-label="Close preview"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-gray-500 transition-colors duration-200 hover:text-gray-800 cursor-pointer"
              whileHover={{ scale: 1.0 }}
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
            >
              <CollapseIcon />
            </motion.button>
          </div>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent flex-1 overflow-y-auto px-14 pb-14 pt-0">
          <ArticleBody>
            <Content components={mdxComponents} />
          </ArticleBody>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

function PreviewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8l8 8m0-8-8 8" />
    </svg>
  )
}
