import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { SidebarProvider } from './context/SidebarContext'
import Layout from './components/Layout'
import MDXPost from './components/MDXPost'
import Posts from './pages/Posts'
import About from './pages/About'
import { posts } from './content/posts'

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/posts" replace />} />
          <Route path="/posts" element={<Posts />} />
          {posts.map((post) => (
            <Route
              key={post.meta.slug}
              path={`/posts/${post.meta.slug}`}
              element={<MDXPost meta={post.meta} Content={post.Content} />}
            />
          ))}
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
