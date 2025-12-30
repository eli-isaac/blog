import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ArticleBodyProps {
  children: ReactNode
}

export default function ArticleBody({ children }: ArticleBodyProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="mt-8"
    >
      {children}
    </motion.div>
  )
}
