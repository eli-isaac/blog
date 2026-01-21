import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// =============================================================================
// CONFIGURATION
// =============================================================================

// Node settings
const NODE_COUNT = 150
const NODE_MIN_RADIUS = 2
const NODE_MAX_RADIUS = 6
const NODE_MIN_OPACITY = 0.15
const NODE_MAX_OPACITY = 0.35
const NODE_COLOR = '100, 100, 100'

// Movement settings
const NODE_SPEED = 0.4

// Connection settings
const CONNECTION_DISTANCE = 140
const CONNECTION_OPACITY = 0.15
const CONNECTION_LINE_WIDTH = 0.6
const CONNECTION_COLOR = '100, 100, 100'

// =============================================================================
// PORTAL NODE CONFIGURATION
// =============================================================================

export interface PortalConfig {
  id: string
  path: string
  color: string // RGB string like '220, 60, 60'
  radius: number // Size of the portal node
  label: string // Label to show on hover
}

// =============================================================================

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

interface PortalNode extends Node {
  config: PortalConfig
}

interface Props {
  portals: PortalConfig[]
}

export default function HomeBackground({ portals }: Props) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const portalNodesRef = useRef<PortalNode[]>([])
  const animationRef = useRef<number>(0)
  
  const [flyingPortal, setFlyingPortal] = useState<{
    config: PortalConfig
    x: number
    y: number
  } | null>(null)
  
  // Ref to track flying portal ID so canvas loop can skip drawing it
  const flyingPortalIdRef = useRef<string | null>(null)
  // Ref to track hovered portal ID for canvas drawing
  const hoveredPortalIdRef = useRef<string | null>(null)

  const [hoveredPortal, setHoveredPortal] = useState<{
    label: string
    x: number
    y: number
  } | null>(null)
  
  const [topFlash, setTopFlash] = useState<string | null>(null) // color of the flash

  // Handle portal click
  const handlePortalClick = (portal: PortalNode) => {
    setHoveredPortal(null)
    flyingPortalIdRef.current = portal.config.id
    setFlyingPortal({
      config: portal.config,
      x: portal.x,
      y: portal.y,
    })
    
    // Flash the top when node reaches it
    setTimeout(() => {
      setTopFlash(portal.config.color)
    }, 400)
    
    // Navigate when animation completes (node reaches top)
    setTimeout(() => {
      navigate(portal.config.path)
    }, 550)
  }

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create regular nodes
    const nodes: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * NODE_SPEED,
        vy: (Math.random() - 0.5) * NODE_SPEED,
        radius: NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS),
        opacity: NODE_MIN_OPACITY + Math.random() * (NODE_MAX_OPACITY - NODE_MIN_OPACITY),
      })
    }
    nodesRef.current = nodes

    // Create portal nodes - spread them out across the canvas
    const portalNodes: PortalNode[] = portals.map((config, index) => {
      const angle = (index / portals.length) * Math.PI * 2 + Math.PI / 4
      const distanceFromCenter = Math.min(canvas.width, canvas.height) * 0.25
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      return {
        x: centerX + Math.cos(angle) * distanceFromCenter,
        y: centerY + Math.sin(angle) * distanceFromCenter,
        vx: (Math.random() - 0.5) * NODE_SPEED * 0.5,
        vy: (Math.random() - 0.5) * NODE_SPEED * 0.5,
        radius: config.radius,
        opacity: 0.5,
        config,
      }
    })
    portalNodesRef.current = portalNodes

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      for (const portal of portalNodes) {
        const dx = portal.x - x
        const dy = portal.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < portal.radius * 2.5) {
          handlePortalClick(portal)
          return
        }
      }
    }
    canvas.addEventListener('click', handleClick)

    // Cursor and hover handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let foundPortal: PortalNode | null = null
      for (const portal of portalNodes) {
        const dx = portal.x - x
        const dy = portal.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < portal.radius * 2.5) {
          foundPortal = portal
          break
        }
      }
      
      canvas.style.cursor = foundPortal ? 'pointer' : 'default'
      
      if (foundPortal) {
        hoveredPortalIdRef.current = foundPortal.config.id
        setHoveredPortal({
          label: foundPortal.config.label,
          x: foundPortal.x,
          y: foundPortal.y,
        })
      } else {
        hoveredPortalIdRef.current = null
        setHoveredPortal(null)
      }
    }
    canvas.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const allNodes = [...nodes, ...portalNodes]

      // Draw connections
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const dx = allNodes[i].x - allNodes[j].x
          const dy = allNodes[i].y - allNodes[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < CONNECTION_DISTANCE) {
            const opacity = (1 - distance / CONNECTION_DISTANCE) * CONNECTION_OPACITY
            ctx.beginPath()
            ctx.moveTo(allNodes[i].x, allNodes[i].y)
            ctx.lineTo(allNodes[j].x, allNodes[j].y)
            ctx.strokeStyle = `rgba(${CONNECTION_COLOR}, ${opacity})`
            ctx.lineWidth = CONNECTION_LINE_WIDTH
            ctx.stroke()
          }
        }
      }

      // Update and draw regular nodes
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1

        node.x = Math.max(0, Math.min(canvas.width, node.x))
        node.y = Math.max(0, Math.min(canvas.height, node.y))

        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${NODE_COLOR}, ${node.opacity})`
        ctx.fill()
      }

      // Update and draw portal nodes - more subtle, like regular nodes but colored
      for (const portal of portalNodes) {
        // Skip drawing if this portal is currently flying
        if (flyingPortalIdRef.current === portal.config.id) {
          continue
        }
        
        portal.x += portal.vx
        portal.y += portal.vy

        const padding = 100
        if (portal.x < padding || portal.x > canvas.width - padding) portal.vx *= -1
        if (portal.y < padding || portal.y > canvas.height - padding) portal.vy *= -1

        portal.x = Math.max(padding, Math.min(canvas.width - padding, portal.x))
        portal.y = Math.max(padding, Math.min(canvas.height - padding, portal.y))

        const color = portal.config.color
        
        // Check if this portal is hovered (using ref for hover state)
        const isHovered = hoveredPortalIdRef.current === portal.config.id
        const coreOpacity = isHovered ? 1 : 0.65
        const glowOpacity = isHovered ? 0.25 : 0.12

        // Subtle outer glow
        ctx.beginPath()
        ctx.arc(portal.x, portal.y, portal.radius * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${glowOpacity})`
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${coreOpacity})`
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationRef.current)
    }
  }, [portals, navigate])

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
        />
      </div>

      {/* Hover tooltip */}
      {hoveredPortal && !flyingPortal && (
        <div
          className="fixed z-40 pointer-events-none text-sm text-gray-500 font-medium"
          style={{
            left: hoveredPortal.x,
            top: hoveredPortal.y - 30,
            transform: 'translateX(-50%)',
          }}
        >
          {hoveredPortal.label}
        </div>
      )}

      {/* Isaac's Ram text in bottom left */}
      <div className="fixed bottom-6 left-6 z-10 text-5xl font-medium text-gray-300">
        Isaac & The Ram
      </div>

      {/* Flying portal node - shoots straight up */}
      {flyingPortal && (
        <motion.div
          className="fixed z-50 rounded-full"
          style={{
            backgroundColor: `rgb(${flyingPortal.config.color})`,
            width: 16,
            height: 16,
          }}
          initial={{ 
            left: flyingPortal.x,
            top: flyingPortal.y,
            x: '-50%',
            y: '-50%',
            scale: 1,
            opacity: 1,
          }}
          animate={{ 
            left: flyingPortal.x,
            top: -20,
            x: '-50%',
            y: 0,
            scale: 1.5,
            opacity: 1,
          }}
          transition={{ 
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      )}

      {/* Top flash when node hits the top */}
      {topFlash && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-40"
          style={{
            height: 4,
            backgroundColor: `rgb(${topFlash})`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.1 }}
        />
      )}
    </>
  )
}
