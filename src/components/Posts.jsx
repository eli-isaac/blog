import { Link } from 'react-router-dom'
import posts from '../posts.json'
import PostHeader from './PostHeader'

function getSlug(link) {
  return link.split('/').pop()
}

export default function Posts() {
  return (
    <div className="pt-24 max-w-xl px-6 mx-auto md:mx-0 md:ml-[20%] md:px-0">
      <ul className="space-y-6">
        {posts.map((post, i) => (
          <li key={i} className="pb-2">
            <Link to={post.link} className="block group hover:opacity-70">
              <PostHeader 
                title={post.title}
                subtitle={post.subtitle}
                date={post.date}
                slug={getSlug(post.link)}
                size="small"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
