import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SidebarProvider } from './context/SidebarContext'
import Layout from './components/Layout'
import MDXPost from './components/MDXPost'
import Home from './pages/Home'
import About from './pages/About'

// Import MDX posts
import ActivationFunctionsContent, { meta as activationFunctionsMeta } from './content/activation-functions.mdx'

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/posts" replace />} />
          <Route path="/posts" element={<Home />} />
          <Route 
            path="/posts/activation-functions-in-neural-networks" 
            element={<MDXPost meta={activationFunctionsMeta} Content={ActivationFunctionsContent} />} 
          />
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
        <AnimatedRoutes />
      </SidebarProvider>
    </BrowserRouter>
  )
}
