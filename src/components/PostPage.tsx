import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import PostHeader from './PostHeader'
import ArticleBody from './ArticleBody'

interface PostPageProps {
  title: string
  subtitle?: string
  date?: string
  authors?: string[]
  slug?: string
  children: ReactNode
}

export default function PostPage({ title, subtitle, date, authors, slug, children }: PostPageProps) {
  return (
    <motion.article
      layoutId={slug ? `post-shell-${slug}` : undefined}
      className="pt-24 pb-24 max-w-xl px-6 mx-auto md:mx-0 md:ml-[20%] md:px-0"
    >
      <header className="mb-8">
        <PostHeader 
          title={title}
          subtitle={subtitle}
          date={date}
          authors={authors}
          slug={slug}
          size="large"
        />
      </header>
      
      <ArticleBody>
        {children}
      </ArticleBody>
    </motion.article>
  )
}
