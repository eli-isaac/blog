import { Outlet, useLocation, Link } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'
import SidebarBackground, { SIDEBAR_THEMES, SidebarPortalConfig } from './SidebarBackground'
import Breadcrumbs from './Breadcrumbs'

// Portal nodes that float in the sidebar
const SIDEBAR_PORTALS: SidebarPortalConfig[] = [
  {
    id: 'posts',
    path: '/posts',
    color: '160, 80, 80',
    label: 'Blog Posts',
  },
  {
    id: 'about',
    path: '/about',
    color: '80, 110, 90',
    label: 'About',
  },
]

// Sidebar configuration per section
const SIDEBAR_CONFIG = {
  posts: {
    bgClass: 'border-stone-200/60',
    bgStyle: { background: '#efefe2' },
    theme: SIDEBAR_THEMES.posts,
  },
  about: {
    bgClass: 'border-stone-200/60',
    bgStyle: { background: '#efefe2' },
    theme: SIDEBAR_THEMES.about,
  },
  default: {
    bgClass: 'border-stone-200/60',
    bgStyle: { background: '#efefe2' },
    theme: SIDEBAR_THEMES.posts,
  },
} as const

function getSidebarConfig(pathname: string) {
  if (pathname.startsWith('/posts')) return SIDEBAR_CONFIG.posts
  if (pathname.startsWith('/about')) return SIDEBAR_CONFIG.about
  return SIDEBAR_CONFIG.default
}

function getActivePortalId(pathname: string): string | undefined {
  if (pathname.startsWith('/posts')) return 'posts'
  if (pathname.startsWith('/about')) return 'about'
  return undefined
}

export default function Layout() {
  const { isOpen, toggle, close } = useSidebar()
  const location = useLocation()

  const sidebarConfig = getSidebarConfig(location.pathname)
  const showBackground = location.pathname.startsWith('/posts') || location.pathname.startsWith('/about')
  const activePortalId = getActivePortalId(location.pathname)

  return (
    <div className="relative min-h-dvh sidebar:flex" style={{ backgroundColor: '#efefe2' }}>
      {/* Mobile toggle button */}
      <button 
        onClick={toggle}
        className="fixed top-4 left-4 z-50 p-2 hover:bg-gray-100 rounded sidebar:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 sidebar:hidden" 
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed sidebar:sticky top-0 left-0 h-dvh z-40
          ${sidebarConfig.bgClass} border-l border-r border-stone-300/60 w-64 p-6 overflow-hidden
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          sidebar:translate-x-0
        `}
        style={sidebarConfig.bgStyle}
      >
        {/* Animated sidebar background with portal nodes */}
        {showBackground && (
          <SidebarBackground
            theme={sidebarConfig.theme}
            portals={SIDEBAR_PORTALS}
            activePortalId={activePortalId}
          />
        )}

        {/* Mobile logo at bottom of sidebar */}
        <Link
          to="/"
          onClick={close}
          className="absolute bottom-6 left-6 right-6 sidebar:hidden z-10"
        >
          <img src="/arrowsmith.png" alt="Arrowsmith" className="w-12 h-12 rounded-lg opacity-70 hover:opacity-100 transition-opacity" />
        </Link>
      </aside>

      {/* Breadcrumbs — fixed, bottom-left, outside sidebar */}
      <Breadcrumbs />

      {/* Main content */}
      <main className="relative z-10 flex-1 pt-16 sidebar:pt-6 px-6">
        <Outlet />
      </main>
    </div>
  )
}
