import PostHeader from './PostHeader'
import ArticleBody from './ArticleBody'

export default function PostPage({ title, subtitle, date, slug, children }) {
  return (
    <article className="pt-24 max-w-xl px-6 mx-auto md:mx-0 md:ml-[20%] md:px-0">
      <header className="mb-8">
        <PostHeader 
          title={title}
          subtitle={subtitle}
          date={date}
          slug={slug}
          size="large"
        />
      </header>
      
      <ArticleBody>
        {children}
      </ArticleBody>
    </article>
  )
}
