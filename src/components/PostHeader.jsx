import { motion } from 'framer-motion'

export default function PostHeader({ title, subtitle, date, authors, slug, size = 'small' }) {
  const isLarge = size === 'large'
  
  return (
    <div>
      <motion.h1 
        layoutId={slug ? `title-${slug}` : undefined}
        className={isLarge 
          ? 'text-3xl font-bold mb-3 tracking-tight' 
          : 'text-lg font-semibold tracking-tight'
        }
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p 
          layoutId={slug ? `subtitle-${slug}` : undefined}
          className={isLarge ? 'text-gray-500 text-lg' : 'text-gray-500 text-sm'}
        >
          {subtitle}
        </motion.p>
      )}
      <div className={isLarge ? 'mt-3 flex items-center gap-2 text-sm' : 'mt-1 flex items-center gap-2 text-xs'}>
        {authors && authors.length > 0 && (
          <motion.span 
            layoutId={slug ? `authors-${slug}` : undefined}
            className="text-gray-600"
          >
            {authors.join(' & ')}
          </motion.span>
        )}
        {authors && authors.length > 0 && date && (
          <span className="text-gray-300">·</span>
        )}
        {date && (
          <motion.span 
            layoutId={slug ? `date-${slug}` : undefined}
            className="text-gray-400"
          >
            {date}
          </motion.span>
        )}
      </div>
    </div>
  )
}
