import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// =============================================================================
// CONFIGURATION
// =============================================================================

// Background
const BACKGROUND_COLOR = '#efefe2'

// Construct boundary
const CANVAS_MARGIN = 50 // Inset from screen edge; radius = min(w,h)/2 - margin
const SPAWN_RADIUS_RATIO = 0.08 // Fraction of construct radius nodes start in

// Node settings
const NODE_COUNT = 200
const NODE_MIN_RADIUS = 4
const NODE_MAX_RADIUS = 7
const NODE_OPACITY = 0.7
const NODE_MIN_SHADE = 140 // Darker grey
const NODE_MAX_SHADE = 210 // Lighter grey

// Movement settings
const NODE_SPEED = 0.4
const NODE_SPEED_MIN_MULTIPLIER = 0.3 // Min random speed factor per node
const NODE_SPEED_MAX_MULTIPLIER = 2.8 // Max random speed factor per node
const BOUNCE_ANGLE_SPREAD = Math.PI // ±90° randomness on bounce (Math.PI = ±90°)

// Portal node settings
const PORTAL_RADIUS = 8 // Default portal node radius
const PORTAL_SPEED_MULTIPLIER = 0.5 // Portal speed relative to NODE_SPEED
const PORTAL_OPACITY = 0.65 // Core opacity (non-hovered)
const PORTAL_HOVER_OPACITY = 1 // Core opacity (hovered)
const PORTAL_GLOW_OPACITY = 0.12 // Glow opacity (non-hovered)
const PORTAL_HOVER_GLOW_OPACITY = 0.25 // Glow opacity (hovered)
const PORTAL_GLOW_RADIUS_MULTIPLIER = 1.5 // Glow ring size relative to portal radius
const PORTAL_HIT_RADIUS_MULTIPLIER = 2.5 // Click/hover detection area multiplier

// Connection settings
const CONNECTION_DISTANCE = 340
const CONNECTION_PROBABILITY = 0.2 // Probability a valid pair is connected (0–1)
const CONNECTION_OPACITY = 0.13
const CONNECTION_LINE_WIDTH = .8
const CONNECTION_COLOR = '100, 100, 100'

// Flying animation settings
const NAVIGATION_DELAY = 700 // ms before navigating after portal click
const FLYING_CIRCLE_SIZE = 16 // Diameter of the flying circle (px)
const FLYING_CIRCLE_SCALE = 2 // How much it scales up while flying
const COLOR_LINE_HEIGHT = 3 // Height of the top color sweep line (px)

// =============================================================================
// SPHERE DRAWING
// =============================================================================

function drawSphereNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number,
) {
  const highlightX = x - radius * 0.01
  const highlightY = y - radius * 0.01
  const gradient = ctx.createRadialGradient(
    highlightX, highlightY, radius * 0.05,
    x, y, radius,
  )
  gradient.addColorStop(0, `rgba(${color}, ${Math.min(opacity * 1.15, 1)})`)
  gradient.addColorStop(0.5, `rgba(${color}, ${opacity})`)
  gradient.addColorStop(1, `rgba(${color}, ${opacity * 0.15})`)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
}

// =============================================================================
// PORTAL NODE CONFIGURATION
// =============================================================================

export interface PortalConfig {
  id: string
  path: string
  color: string // RGB string like '220, 60, 60'
  radius?: number // Size of the portal node (defaults to PORTAL_RADIUS)
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
  color: string // per-node RGB shade string
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
  
  // Handle portal click
  const handlePortalClick = (portal: PortalNode) => {
    setHoveredPortal(null)
    flyingPortalIdRef.current = portal.config.id
    setFlyingPortal({
      config: portal.config,
      x: portal.x,
      y: portal.y,
    })
    
    // Navigate after circle flies off and line sweeps in
    setTimeout(() => {
      navigate(portal.config.path)
    }, NAVIGATION_DELAY)
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

    // Spherical boundary — nodes live inside a circle
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const constructRadius = Math.min(canvas.width, canvas.height) / 2 - CANVAS_MARGIN

    // Create regular nodes — spawned bunched near the center, they drift outward naturally
    const SPAWN_RADIUS = constructRadius * SPAWN_RADIUS_RATIO
    const nodes: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * SPAWN_RADIUS
      nodes.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * NODE_SPEED * (NODE_SPEED_MIN_MULTIPLIER + Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER)),
        vy: (Math.random() - 0.5) * NODE_SPEED * (NODE_SPEED_MIN_MULTIPLIER + Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER)),
        radius: NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS),
        opacity: NODE_OPACITY,
        color: (() => { const s = Math.round(NODE_MIN_SHADE + Math.random() * (NODE_MAX_SHADE - NODE_MIN_SHADE)); return `${s}, ${s}, ${s}` })(),
      })
    }
    nodesRef.current = nodes

    // Create portal nodes - start near center, drift outward with the rest
    const portalNodes: PortalNode[] = portals.map((config, index) => {
      const angle = (index / portals.length) * Math.PI * 2 + Math.PI / 4
      const r = Math.random() * SPAWN_RADIUS
      
      return {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER,
        vy: (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER,
        radius: config.radius ?? PORTAL_RADIUS,
        opacity: 0.5,
        color: config.color,
        config,
      }
    })
    portalNodesRef.current = portalNodes

    // Precompute which node pairs are eligible for connections
    const allNodesForPairs = [...nodes, ...portalNodes]
    const connectionEligible = new Set<string>()
    for (let i = 0; i < allNodesForPairs.length; i++) {
      for (let j = i + 1; j < allNodesForPairs.length; j++) {
        if (Math.random() < CONNECTION_PROBABILITY) {
          connectionEligible.add(`${i}-${j}`)
        }
      }
    }

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      for (const portal of portalNodes) {
        const dx = portal.x - x
        const dy = portal.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < portal.radius * PORTAL_HIT_RADIUS_MULTIPLIER) {
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
        
        if (distance < portal.radius * PORTAL_HIT_RADIUS_MULTIPLIER) {
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

      // Draw connections (only for pre-selected eligible pairs)
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          if (!connectionEligible.has(`${i}-${j}`)) continue

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

        // Bounce off circular boundary — randomize direction, keep speed
        const ndx = node.x - centerX
        const ndy = node.y - centerY
        const nDist = Math.sqrt(ndx * ndx + ndy * ndy)
        if (nDist > constructRadius) {
          const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
          // Pick a random inward-ish angle (biased away from the boundary)
          const outAngle = Math.atan2(ndy, ndx)
          const newAngle = outAngle + Math.PI + (Math.random() - 0.5) * BOUNCE_ANGLE_SPREAD
          node.vx = Math.cos(newAngle) * speed
          node.vy = Math.sin(newAngle) * speed
          node.x = centerX + (ndx / nDist) * constructRadius
          node.y = centerY + (ndy / nDist) * constructRadius
        }

        drawSphereNode(ctx, node.x, node.y, node.radius, node.color, node.opacity)
      }

      // Update and draw portal nodes - more subtle, like regular nodes but colored
      for (const portal of portalNodes) {
        // Skip drawing if this portal is currently flying
        if (flyingPortalIdRef.current === portal.config.id) {
          continue
        }
        
        portal.x += portal.vx
        portal.y += portal.vy

        // Bounce off circular boundary — randomize direction, keep speed
        const pdx = portal.x - centerX
        const pdy = portal.y - centerY
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy)
        if (pDist > constructRadius) {
          const speed = Math.sqrt(portal.vx * portal.vx + portal.vy * portal.vy)
          const outAngle = Math.atan2(pdy, pdx)
          const newAngle = outAngle + Math.PI + (Math.random() - 0.5) * BOUNCE_ANGLE_SPREAD
          portal.vx = Math.cos(newAngle) * speed
          portal.vy = Math.sin(newAngle) * speed
          portal.x = centerX + (pdx / pDist) * constructRadius
          portal.y = centerY + (pdy / pDist) * constructRadius
        }

        const color = portal.config.color
        
        // Check if this portal is hovered (using ref for hover state)
        const isHovered = hoveredPortalIdRef.current === portal.config.id
        const coreOpacity = isHovered ? PORTAL_HOVER_OPACITY : PORTAL_OPACITY
        const glowOpacity = isHovered ? PORTAL_HOVER_GLOW_OPACITY : PORTAL_GLOW_OPACITY

        // Outer glow sphere
        drawSphereNode(ctx, portal.x, portal.y, portal.radius * PORTAL_GLOW_RADIUS_MULTIPLIER, color, glowOpacity)

        // Core sphere
        drawSphereNode(ctx, portal.x, portal.y, portal.radius, color, coreOpacity)
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
        className="fixed inset-0"
        style={{ backgroundColor: BACKGROUND_COLOR }}
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
      <div className="fixed bottom-6 left-6 z-10 text-5xl font-medium" style={{ color: '#c9c9b8' }}>
        Isaacs Ram
      </div>

      {/* Flying circle - expands 3x as it flies off the top of the screen */}
      {flyingPortal && (
        <motion.div
          className="fixed z-50 rounded-full"
          style={{
            backgroundColor: `rgb(${flyingPortal.config.color})`,
            width: FLYING_CIRCLE_SIZE,
            height: FLYING_CIRCLE_SIZE,
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
            top: -50,
            x: '-50%',
            y: '-50%',
            scale: FLYING_CIRCLE_SCALE,
            opacity: 1,
          }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0, 0.2, 1],
          }}
        />
      )}

      {/* Color line expands from where the circle hit the top */}
      {flyingPortal && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            height: COLOR_LINE_HEIGHT,
            backgroundColor: `rgb(${flyingPortal.config.color})`,
            transformOrigin: `${flyingPortal.x}px center`,
          }}
          initial={{ scaleX: (FLYING_CIRCLE_SIZE * 3) / window.innerWidth, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            scaleX: {
              delay: 0.28,
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            },
            opacity: {
              delay: 0.28,
              duration: 0,
            },
          }}
        />
      )}
    </>
  )
}
