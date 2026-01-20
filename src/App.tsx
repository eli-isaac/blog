import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { SidebarProvider } from './context/SidebarContext'
import Layout from './components/Layout'
import MDXPost from './components/MDXPost'
import Posts from './pages/Posts'
import Projects from './pages/Projects'
import About from './pages/About'
import Home from './pages/Home'
import { posts } from './content/posts'

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Home page without Layout */}
        <Route path="/" element={<Home />} />
        
        {/* Pages with Layout (sidebar) */}
        <Route element={<Layout />}>
          <Route path="/posts" element={<Posts />} />
          {posts.map((post) => (
            <Route
              key={post.meta.slug}
              path={`/posts/${post.meta.slug}`}
              element={<MDXPost meta={post.meta} Content={post.Content} />}
            />
          ))}
          <Route path="/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <LayoutGroup>
          <AnimatedRoutes />
        </LayoutGroup>
      </SidebarProvider>
    </BrowserRouter>
  )
}
