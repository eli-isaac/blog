import { motion } from 'framer-motion'

export default function ArticleBody({ children }) {
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

