import { useEffect, useRef } from 'react'

// =============================================================================
// CONFIGURATION - Adjust these values to tweak the neural network background
// =============================================================================

// Node settings
const NODE_COUNT = 100
const NODE_MIN_RADIUS = 1.5
const NODE_MAX_RADIUS = 5.5 // radius = MIN + random * (MAX - MIN)
const NODE_MIN_OPACITY = 0.1
const NODE_MAX_OPACITY = 0.35
const NODE_COLOR = '180, 180, 180' // RGB values

// Movement settings
const NODE_SPEED = 0.3 // velocity multiplier

// Connection settings
const CONNECTION_DISTANCE = 120 // max distance for connections
const CONNECTION_OPACITY = 0.12 // max opacity of lines
const CONNECTION_LINE_WIDTH = 0.5
const CONNECTION_COLOR = '180, 180, 180' // RGB values

// Flash settings
const FLASH_CHANCE = 0.01 // probability per frame (0-1)
const FLASH_MIN_DURATION = 1000 // milliseconds
const FLASH_MAX_DURATION = 2000 // milliseconds
const FLASH_GLOW_OPACITY = 0.3 // outer glow max opacity
const FLASH_CORE_OPACITY = 0.75 // inner core max opacity
const FLASH_GLOW_SIZE = 2 // multiplier for glow radius
const FLASH_CORE_SIZE = 1.3 // multiplier for core radius
const FLASH_GLOW_COLOR = '180, 50, 50' // RGB - dark red
const FLASH_CORE_COLOR = '200, 60, 60' // RGB - dark red

// =============================================================================

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  flashTime: number
  flashDuration: number
}

// Easing function for smooth fade out (starts fast, slows down)
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export default function PostsBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const animationRef = useRef<number>(0)

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

    // Create nodes
    const nodes: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * NODE_SPEED,
        vy: (Math.random() - 0.5) * NODE_SPEED,
        radius: NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS),
        opacity: NODE_MIN_OPACITY + Math.random() * (NODE_MAX_OPACITY - NODE_MIN_OPACITY),
        flashTime: 0,
        flashDuration: 0,
      })
    }
    nodesRef.current = nodes

    const animate = (currentTime: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Randomly trigger flashes
      if (Math.random() < FLASH_CHANCE) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)]
        randomNode.flashTime = currentTime
        randomNode.flashDuration = FLASH_MIN_DURATION + Math.random() * (FLASH_MAX_DURATION - FLASH_MIN_DURATION)
      }

      // Draw connections first (behind nodes)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < CONNECTION_DISTANCE) {
            const opacity = (1 - distance / CONNECTION_DISTANCE) * CONNECTION_OPACITY
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(${CONNECTION_COLOR}, ${opacity})`
            ctx.lineWidth = CONNECTION_LINE_WIDTH
            ctx.stroke()
          }
        }
      }

      // Update and draw nodes
      for (const node of nodes) {
        // Move
        node.x += node.vx
        node.y += node.vy

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1

        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x))
        node.y = Math.max(0, Math.min(canvas.height, node.y))

        // Check if flashing
        const timeSinceFlash = currentTime - node.flashTime
        const isFlashing = timeSinceFlash < node.flashDuration

        if (isFlashing) {
          // Calculate fade with easing - appears instantly, fades out smoothly
          const flashProgress = timeSinceFlash / node.flashDuration
          const fadeMultiplier = 1 - easeOutCubic(flashProgress)

          // Glow effect (outer)
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius * FLASH_GLOW_SIZE, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${FLASH_GLOW_COLOR}, ${fadeMultiplier * FLASH_GLOW_OPACITY})`
          ctx.fill()

          // Core (inner)
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius * FLASH_CORE_SIZE, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${FLASH_CORE_COLOR}, ${fadeMultiplier * FLASH_CORE_OPACITY})`
          ctx.fill()
        } else {
          // Normal node
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${NODE_COLOR}, ${node.opacity})`
          ctx.fill()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate(performance.now())

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
    </div>
  )
}
