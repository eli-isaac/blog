import { motion } from 'framer-motion'

export default function PostHeader({ title, subtitle, date, slug, size = 'small' }) {
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
      {date && (
        <motion.span 
          layoutId={slug ? `date-${slug}` : undefined}
          className={isLarge ? 'text-gray-400 text-sm mt-2 block' : 'text-gray-400 text-xs mt-1 block'}
        >
          {date}
        </motion.span>
      )}
    </div>
  )
}
