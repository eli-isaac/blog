import { Outlet, useLocation } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'
import HomeButton from './HomeButton'
import PostsBackground from './PostsBackground'

export default function Layout() {
  const { isOpen, toggle, close } = useSidebar()
  const location = useLocation()

  const showPostsBackground = location.pathname.startsWith('/posts')

  return (
    <div className="relative min-h-screen md:flex">
      {showPostsBackground && <PostsBackground />}

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
          bg-white/60 backdrop-blur-sm border-r border-slate-200/60 w-64 p-6
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Sidebar background tint so the posts backdrop shows through */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-100/50 via-white/30 to-slate-100/50" />
        {/* Sidebar content */}
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 pt-16 md:pt-6 px-6">
        <Outlet />
      </main>
      <HomeButton />
    </div>
  )
}
