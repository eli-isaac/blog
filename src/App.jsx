import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SidebarProvider } from './context/SidebarContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import ActivationFunctions from './pages/posts/ActivationFunctions'

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/posts" replace />} />
          <Route path="/posts" element={<Home />} />
          <Route path="/posts/activation-functions-in-neural-networks" element={<ActivationFunctions />} />
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
