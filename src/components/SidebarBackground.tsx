import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// =============================================================================
// CONFIGURATION
// =============================================================================

// Sphere burst animation — nodes start clustered and expand outward
const SPAWN_RADIUS_RATIO = 0.5        // Fraction of sphere radius where nodes start
const SPHERE_DURATION = 0                 // Seconds nodes bounce inside the sphere
const EXPANSION_DURATION = 3             // Seconds for sphere to expand to fill sidebar
const CANVAS_MARGIN = 20                  // Inset from sidebar edges for initial sphere

// Node settings
const NODE_COUNT = 150
const NODE_MIN_RADIUS = 1.5
const NODE_MAX_RADIUS = 5.5
const NODE_MIN_OPACITY = 0.15
const NODE_MAX_OPACITY = 0.5
const NODE_MIN_SHADE = 140
const NODE_MAX_SHADE = 195
const NODE_SPEED = 0.3
const NODE_SPEED_MIN_MULTIPLIER = 0.5
const NODE_SPEED_MAX_MULTIPLIER = 2.0
const BOUNCE_ANGLE_SPREAD = Math.PI       // ±90° randomness on bounce

// Connection settings
const CONNECTION_DISTANCE = 120
const CONNECTION_PROBABILITY = 0.12       // Fraction of valid pairs that get connected
const CONNECTION_OPACITY = 0.12
const CONNECTION_LINE_WIDTH = 0.5
const CONNECTION_COLOR = '170, 170, 170'

// Flash settings
const FLASH_CHANCE = 0.01
const FLASH_MIN_DURATION = 1000
const FLASH_MAX_DURATION = 2000
const FLASH_GLOW_OPACITY = 0.3
const FLASH_CORE_OPACITY = 0.75
const FLASH_GLOW_SIZE = 2
const FLASH_CORE_SIZE = 1.3

// Portal settings
const PORTAL_RADIUS = 6
const PORTAL_SPEED_MULTIPLIER = 0.4
const PORTAL_OPACITY = 0.55
const PORTAL_HOVER_OPACITY = 0.9
const PORTAL_ACTIVE_OPACITY = 0.75
const PORTAL_GLOW_RADIUS = 1.6
const PORTAL_GLOW_OPACITY = 0.1
const PORTAL_HOVER_GLOW_OPACITY = 0.22
const PORTAL_HIT_RADIUS = 2.5            // Multiplier for click/hover detection

// =============================================================================
// TYPES
// =============================================================================

export interface SidebarTheme {
  flashGlowColor: string
  flashCoreColor: string
}

export const SIDEBAR_THEMES = {
  posts: {
    flashGlowColor: '180, 50, 50',
    flashCoreColor: '200, 60, 60',
  },
  about: {
    flashGlowColor: '40, 100, 60',
    flashCoreColor: '50, 120, 80',
  },
} as const

export interface SidebarPortalConfig {
  id: string
  path: string
  color: string   // RGB string like '160, 80, 80'
  label: string
}

interface Props {
  theme?: SidebarTheme
  portals?: SidebarPortalConfig[]
  activePortalId?: string
}

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  baseSpeed: number
  radius: number
  opacity: number
  color: string       // Per-node RGB shade string
  flashTime: number
  flashDuration: number
}

interface PortalNode {
  x: number
  y: number
  vx: number
  vy: number
  baseSpeed: number
  radius: number
  config: SidebarPortalConfig
}

// =============================================================================
// DRAWING
// =============================================================================

/** Radial-gradient sphere node — matches the style in HomeBackground */
function drawSphereNode(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radius: number,
  color: string,
  opacity: number,
) {
  const gradient = ctx.createRadialGradient(
    x - radius * 0.01, y - radius * 0.01, radius * 0.05,
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

const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t)
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

// =============================================================================
// COMPONENT
// =============================================================================

export default function SidebarBackground({
  theme = SIDEBAR_THEMES.posts,
  portals = [],
  activePortalId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const portalNodesRef = useRef<PortalNode[]>([])
  const animationRef = useRef<number>(0)
  const hoveredPortalRef = useRef<string | null>(null)
  const navigate = useNavigate()

  const [hoveredPortal, setHoveredPortal] = useState<{
    label: string
    x: number
    y: number
  } | null>(null)

  // --- Event handlers (stable refs via useCallback) ---

  const handleCanvasClick = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    for (const portal of portalNodesRef.current) {
      const dx = portal.x - x
      const dy = portal.y - y
      if (Math.sqrt(dx * dx + dy * dy) < portal.radius * PORTAL_HIT_RADIUS) {
        navigate(portal.config.path)
        return
      }
    }
  }, [navigate])

  const handleCanvasMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let found: PortalNode | null = null
    for (const portal of portalNodesRef.current) {
      const dx = portal.x - x
      const dy = portal.y - y
      if (Math.sqrt(dx * dx + dy * dy) < portal.radius * PORTAL_HIT_RADIUS) {
        found = portal
        break
      }
    }

    canvas.style.cursor = found ? 'pointer' : 'default'
    hoveredPortalRef.current = found?.config.id ?? null
    setHoveredPortal(
      found ? { label: found.config.label, x: found.x, y: found.y } : null,
    )
  }, [])

  const handleCanvasLeave = useCallback(() => {
    hoveredPortalRef.current = null
    setHoveredPortal(null)
    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
  }, [])

  // --- Main animation effect ---

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    resize()
    window.addEventListener('resize', resize)

    // Geometry for sphere burst
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const sphereRadius = Math.min(canvas.width, canvas.height) / 2 - CANVAS_MARGIN
    const fullRadius = Math.sqrt(
      (canvas.width / 2) ** 2 + (canvas.height / 2) ** 2,
    )
    const spawnRadius = sphereRadius * SPAWN_RADIUS_RATIO
    const startTime = performance.now()

    // --- Create regular nodes (spawned clustered near center) ---
    const nodes: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * spawnRadius
      const shade = Math.round(
        NODE_MIN_SHADE + Math.random() * (NODE_MAX_SHADE - NODE_MIN_SHADE),
      )
      const speed =
        NODE_SPEED *
        (NODE_SPEED_MIN_MULTIPLIER +
          Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER))
      const vAngle = Math.random() * Math.PI * 2
      nodes.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: Math.cos(vAngle) * speed,
        vy: Math.sin(vAngle) * speed,
        baseSpeed: speed,
        radius:
          NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS),
        opacity:
          NODE_MIN_OPACITY + Math.random() * (NODE_MAX_OPACITY - NODE_MIN_OPACITY),
        color: `${shade}, ${shade}, ${shade}`,
        flashTime: 0,
        flashDuration: 0,
      })
    }
    nodesRef.current = nodes

    // --- Create portal nodes (also start near center) ---
    const portalNodes: PortalNode[] = portals.map((config, i) => {
      const angle = (i / portals.length) * Math.PI * 2 + Math.PI / 4
      const r = Math.random() * spawnRadius
      const speed = NODE_SPEED * PORTAL_SPEED_MULTIPLIER
      const vAngle = Math.random() * Math.PI * 2
      return {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: Math.cos(vAngle) * speed,
        vy: Math.sin(vAngle) * speed,
        baseSpeed: speed,
        radius: PORTAL_RADIUS,
        config,
      }
    })
    portalNodesRef.current = portalNodes

    // Pre-select which node pairs can form connections (perf optimisation)
    const allNodes = [...nodes, ...portalNodes]
    const connectionEligible = new Set<string>()
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        if (Math.random() < CONNECTION_PROBABILITY) {
          connectionEligible.add(`${i}-${j}`)
        }
      }
    }

    // Event listeners
    canvas.addEventListener('click', handleCanvasClick)
    canvas.addEventListener('mousemove', handleCanvasMove)
    canvas.addEventListener('mouseleave', handleCanvasLeave)

    // --- Animation loop ---
    const animate = (currentTime: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const elapsed = (currentTime - startTime) / 1000

      // Sphere boundary: sphere → expand → full sidebar
      let constructRadius: number
      if (elapsed < SPHERE_DURATION) {
        constructRadius = sphereRadius
      } else if (elapsed < SPHERE_DURATION + EXPANSION_DURATION) {
        const t = (elapsed - SPHERE_DURATION) / EXPANSION_DURATION
        constructRadius = sphereRadius + (fullRadius - sphereRadius) * easeOutQuad(t)
      } else {
        constructRadius = fullRadius
      }

      // Random flashes
      if (Math.random() < FLASH_CHANCE) {
        const node = nodes[Math.floor(Math.random() * nodes.length)]
        node.flashTime = currentTime
        node.flashDuration =
          FLASH_MIN_DURATION +
          Math.random() * (FLASH_MAX_DURATION - FLASH_MIN_DURATION)
      }

      // --- Draw connections ---
      const combined = [...nodes, ...portalNodes] as (Node | PortalNode)[]
      for (let i = 0; i < combined.length; i++) {
        for (let j = i + 1; j < combined.length; j++) {
          if (!connectionEligible.has(`${i}-${j}`)) continue
          const dx = combined[i].x - combined[j].x
          const dy = combined[i].y - combined[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < CONNECTION_DISTANCE) {
            const isPortalEdge =
              i >= nodes.length || j >= nodes.length
            const portalNode = i >= nodes.length
              ? (combined[i] as PortalNode)
              : j >= nodes.length
                ? (combined[j] as PortalNode)
                : null
            const edgeColor = portalNode
              ? portalNode.config.color
              : CONNECTION_COLOR
            const opacity =
              (1 - distance / CONNECTION_DISTANCE) *
              CONNECTION_OPACITY *
              (isPortalEdge ? 0.7 : 1)
            ctx.beginPath()
            ctx.moveTo(combined[i].x, combined[i].y)
            ctx.lineTo(combined[j].x, combined[j].y)
            ctx.strokeStyle = `rgba(${edgeColor}, ${opacity})`
            ctx.lineWidth = CONNECTION_LINE_WIDTH
            ctx.stroke()
          }
        }
      }

      // --- Update & draw regular nodes ---
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy

        // Bounce off spherical boundary
        const ndx = node.x - centerX
        const ndy = node.y - centerY
        const nDist = Math.sqrt(ndx * ndx + ndy * ndy)
        if (nDist > constructRadius) {
          const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
          const outAngle = Math.atan2(ndy, ndx)
          const newAngle =
            outAngle + Math.PI + (Math.random() - 0.5) * BOUNCE_ANGLE_SPREAD
          node.vx = Math.cos(newAngle) * speed
          node.vy = Math.sin(newAngle) * speed
          node.x = centerX + (ndx / nDist) * constructRadius
          node.y = centerY + (ndy / nDist) * constructRadius
        }

        // Clamp to canvas edges
        if (node.x < 0) { node.x = 0; node.vx = Math.abs(node.vx) }
        else if (node.x > canvas.width) { node.x = canvas.width; node.vx = -Math.abs(node.vx) }
        if (node.y < 0) { node.y = 0; node.vy = Math.abs(node.vy) }
        else if (node.y > canvas.height) { node.y = canvas.height; node.vy = -Math.abs(node.vy) }

        // Flash or normal draw
        const timeSinceFlash = currentTime - node.flashTime
        const isFlashing = timeSinceFlash < node.flashDuration

        if (isFlashing) {
          const progress = timeSinceFlash / node.flashDuration
          const fade = 1 - easeOutCubic(progress)
          drawSphereNode(ctx, node.x, node.y, node.radius * FLASH_GLOW_SIZE, theme.flashGlowColor, fade * FLASH_GLOW_OPACITY)
          drawSphereNode(ctx, node.x, node.y, node.radius * FLASH_CORE_SIZE, theme.flashCoreColor, fade * FLASH_CORE_OPACITY)
        } else {
          drawSphereNode(ctx, node.x, node.y, node.radius, node.color, node.opacity)
        }
      }

      // --- Update & draw portal nodes ---
      for (const portal of portalNodes) {
        portal.x += portal.vx
        portal.y += portal.vy

        // Bounce off spherical boundary
        const pdx = portal.x - centerX
        const pdy = portal.y - centerY
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy)
        if (pDist > constructRadius) {
          const speed = Math.sqrt(portal.vx * portal.vx + portal.vy * portal.vy)
          const outAngle = Math.atan2(pdy, pdx)
          const newAngle =
            outAngle + Math.PI + (Math.random() - 0.5) * BOUNCE_ANGLE_SPREAD
          portal.vx = Math.cos(newAngle) * speed
          portal.vy = Math.sin(newAngle) * speed
          portal.x = centerX + (pdx / pDist) * constructRadius
          portal.y = centerY + (pdy / pDist) * constructRadius
        }

        // Clamp to canvas
        portal.x = Math.max(portal.radius, Math.min(canvas.width - portal.radius, portal.x))
        portal.y = Math.max(portal.radius, Math.min(canvas.height - portal.radius, portal.y))

        const isHovered = hoveredPortalRef.current === portal.config.id
        const isActive = activePortalId === portal.config.id
        const coreOpacity = isHovered
          ? PORTAL_HOVER_OPACITY
          : isActive
            ? PORTAL_ACTIVE_OPACITY
            : PORTAL_OPACITY
        const glowOpacity = isHovered
          ? PORTAL_HOVER_GLOW_OPACITY
          : PORTAL_GLOW_OPACITY

        drawSphereNode(ctx, portal.x, portal.y, portal.radius * PORTAL_GLOW_RADIUS, portal.config.color, glowOpacity)
        drawSphereNode(ctx, portal.x, portal.y, portal.radius, portal.config.color, coreOpacity)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate(performance.now())

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', handleCanvasClick)
      canvas.removeEventListener('mousemove', handleCanvasMove)
      canvas.removeEventListener('mouseleave', handleCanvasLeave)
      cancelAnimationFrame(animationRef.current)
    }
  }, [theme, portals, activePortalId, handleCanvasClick, handleCanvasMove, handleCanvasLeave])

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {hoveredPortal && (
        <div
          className="absolute z-10 pointer-events-none text-xs font-medium whitespace-nowrap"
          style={{
            left: hoveredPortal.x,
            top: hoveredPortal.y - 20,
            transform: 'translateX(-50%)',
            color: 'rgba(140, 140, 130, 0.9)',
          }}
        >
          {hoveredPortal.label}
        </div>
      )}
    </div>
  )
}
