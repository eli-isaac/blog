import { motion } from 'framer-motion'
import PostHeader from './PostHeader'
import type { PostMeta } from '../content/posts'

interface PostPreviewProps {
  meta: PostMeta
  onNavigate: () => void
}

export function PostPreview({ meta, onNavigate }: PostPreviewProps) {
  return (
    <motion.article
      className="group relative overflow-hidden rounded-3xl bg-transparent px-8 py-6 cursor-pointer shadow-none"
      initial={false}
      onClick={onNavigate}
    >
      <div className="relative z-10 flex items-start gap-3">
        <PostHeader
          title={meta.title}
          subtitle={meta.subtitle}
          date={meta.date}
          authors={meta.authors}
          slug={meta.slug}
          size="small"
        />
      </div>
    </motion.article>
  )
}
