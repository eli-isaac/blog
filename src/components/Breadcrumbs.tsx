import { Link, useLocation } from 'react-router-dom'
import { posts } from '../content/posts'

/** Map post slugs to their display titles */
const postTitlesBySlug = Object.fromEntries(
  posts.map(p => [p.meta.slug, p.meta.title])
)

/** Friendly labels for known top-level segments */
const segmentLabels: Record<string, string> = {
  posts: 'Posts',
  about: 'About',
}

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = segments.map((segment, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const isPostSlug = i === 1 && segments[0] === 'posts'
    const label = isPostSlug
      ? postTitlesBySlug[segment] || segment
      : segmentLabels[segment] || segment
    return { label, path }
  })

  const allCrumbs = [
    { label: 'Arrowsmith', path: '/' },
    ...crumbs,
  ]

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden sidebar:block fixed bottom-10 left-[17.5rem] z-30"
      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
    >
      <ol className="flex items-center gap-1.5 text-[0.8rem] text-gray-400 whitespace-nowrap">
        {allCrumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {i === allCrumbs.length - 1 ? (
              <span className="text-gray-500">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-gray-600 transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
