import { Link } from 'react-router-dom'
import PostHeader from './PostHeader'

// Import metadata from all MDX posts
import { meta as activationFunctions } from '../content/activation-functions.mdx'

// Build posts list from MDX metadata
const posts = [
  activationFunctions,
]

export default function Posts() {
  return (
    <div className="pt-24 max-w-xl px-6 mx-auto md:mx-0 md:ml-[20%] md:px-0">
      <ul className="space-y-6">
        {posts.map((post, i) => (
          <li key={i} className="pb-2">
            <Link to={`/posts/${post.slug}`} className="block group hover:opacity-70">
              <PostHeader 
                title={post.title}
                subtitle={post.subtitle}
                date={post.date}
                authors={post.authors}
                slug={post.slug}
                size="small"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
