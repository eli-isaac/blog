import { Link, Outlet, useLocation } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'
import PostsBackground, { SIDEBAR_THEMES } from './PostsBackground'

// Sidebar configuration per section
const SIDEBAR_CONFIG = {
  posts: {
    bgClass: 'border-stone-200/60',
    bgStyle: { background: '#efefe2' },
    theme: SIDEBAR_THEMES.posts,
  },
  projects: {
    bgClass: 'border-stone-200/60',
    bgStyle: { background: '#efefe2' },
    theme: SIDEBAR_THEMES.projects,
  },
  default: {
    bgClass: 'border-stone-200/60',
    bgStyle: { background: '#efefe2' },
    theme: SIDEBAR_THEMES.posts,
  },
} as const

function getSidebarConfig(pathname: string) {
  if (pathname.startsWith('/posts')) return SIDEBAR_CONFIG.posts
  if (pathname.startsWith('/projects')) return SIDEBAR_CONFIG.projects
  return SIDEBAR_CONFIG.default
}

export default function Layout() {
  const { isOpen, toggle, close } = useSidebar()
  const location = useLocation()

  const sidebarConfig = getSidebarConfig(location.pathname)
  const showBackground = location.pathname.startsWith('/posts') || location.pathname.startsWith('/projects')

  return (
    <div className="relative min-h-screen md:flex" style={{ backgroundColor: '#efefe2' }}>
      {/* Mobile toggle button */}
      <button 
        onClick={toggle}
        className="fixed top-4 left-4 z-50 p-2 hover:bg-gray-100 rounded md:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-40
          ${sidebarConfig.bgClass} border-l border-r border-stone-300/60 w-64 p-6 overflow-hidden
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={sidebarConfig.bgStyle}
      >
        {/* Neural network background */}
        {showBackground && <PostsBackground theme={sidebarConfig.theme} />}
        
        {/* Arrowsmith text at bottom */}
        <Link to="/" className="absolute bottom-6 left-6 z-10 text-3xl font-medium no-underline hover:opacity-80 transition-opacity" style={{ color: '#c9c9b8' }}>
          Arrowsmith
        </Link>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 pt-16 md:pt-6 px-6">
        <Outlet />
      </main>
    </div>
  )
}
