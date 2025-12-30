import { Link } from 'react-router-dom'
import PostHeader from './PostHeader'
import { posts } from '../content/posts'

export default function Posts() {
  return (
    <div className="pt-24 max-w-xl px-6 mx-auto md:mx-0 md:ml-[20%] md:px-0">
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.meta.slug} className="pb-2">
            <Link to={`/posts/${post.meta.slug}`} className="block group hover:opacity-70">
              <PostHeader 
                title={post.meta.title}
                subtitle={post.meta.subtitle}
                date={post.meta.date}
                authors={post.meta.authors}
                slug={post.meta.slug}
                size="small"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
