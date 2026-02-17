import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// =============================================================================
// CONFIGURATION
// =============================================================================

// Background
const BACKGROUND_COLOR = '#efefe2'

// Timing
const SPHERE_DURATION = window.innerWidth < 768 ? 6 : 8 // Seconds nodes bounce inside sphere
const SCATTER_DURATION = 7          // Seconds nodes drift freely after sphere releases
const TEXT_START = SPHERE_DURATION + SCATTER_DURATION
const TEXT_FORMATION_DURATION = 7   // Seconds for nodes to lerp into text positions
const FORMATION_STAGGER = 5        // Seconds over which node start times are spread
const FORMATION_VELOCITY_DECAY = 0.97
const FORMATION_WANDER_STRENGTH = 1
const CONDENSE_DURATION = 1.2      // Seconds for nodes to scrunch back to center on reset
const TEXT_WOBBLE_SPEED = 5
const TEXT_WOBBLE_RADIUS = 0.6     // Max wobble distance from target (px)

// Text
const TEXT_TO_RENDER = 'ARROWSMITH'
const TEXT_WIDTH_RATIO_MOBILE = 0.92
const TEXT_WIDTH_RATIO_DESKTOP = 0.35
const TEXT_MAX_FONT_SIZE = 400
const TEXT_FONT_WEIGHT = 400

// Sphere boundary
const CANVAS_MARGIN = 100          // Inset from screen edge for sphere radius calc
const MAX_SPHERE_RADIUS = 250      // Cap on sphere radius (px)
const SPAWN_RADIUS_RATIO = 0.05    // Fraction of sphere radius nodes start in
const BOUNCE_ANGLE_SPREAD = Math.PI // ±90° randomness on sphere bounce

// Nodes
const NODE_COUNT = window.innerWidth < 768 ? 350 : 450
const NODE_MIN_RADIUS = window.innerWidth < 768 ? 3 : 4
const NODE_MAX_RADIUS = window.innerWidth < 768 ? 4 : 7
const NODE_OPACITY = 0.7
const NODE_MIN_SHADE = 90
const NODE_MAX_SHADE = 160
const NODE_SPEED = window.innerWidth < 768 ? 0.45 : 1
const NODE_SPEED_MIN_MULTIPLIER = 0.3
const NODE_SPEED_MAX_MULTIPLIER = 2.8

// Portals
const PORTAL_RADIUS = 8
const PORTAL_SPEED_MULTIPLIER = 0.5
const PORTAL_OPACITY = 0.65
const PORTAL_HOVER_OPACITY = 1
const PORTAL_GLOW_OPACITY = 0.12
const PORTAL_HOVER_GLOW_OPACITY = 0.25
const PORTAL_GLOW_RADIUS_MULTIPLIER = 1.5
const PORTAL_HIT_RADIUS_MULTIPLIER = 2.5

// Connections
const CONNECTION_DISTANCE = window.innerWidth < 768 ? 120 : 250
const CONNECTION_PROBABILITY = 0.08
const CONNECTION_OPACITY = 0.13
const CONNECTION_LINE_WIDTH = 0.8
const CONNECTION_COLOR = '100, 100, 100'

// Edge vignette
const EDGE_SHADOW_SIZE = 200
const EDGE_SHADOW_OPACITY = 0.15

// Navigation animation
const NAVIGATION_DELAY = 700
const FLYING_CIRCLE_SIZE = 16
const FLYING_CIRCLE_SCALE = 2
const COLOR_LINE_HEIGHT = 3

// =============================================================================
// HELPERS
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

function sampleTextPositions(
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  count: number,
): { x: number; y: number }[] {
  const offscreen = document.createElement('canvas')
  offscreen.width = canvasWidth
  offscreen.height = canvasHeight
  const offCtx = offscreen.getContext('2d')!
  const textWidthRatio = canvasWidth < 768 ? TEXT_WIDTH_RATIO_MOBILE : TEXT_WIDTH_RATIO_DESKTOP

  let fontSize = 200
  offCtx.font = `${TEXT_FONT_WEIGHT} ${fontSize}px "Outfit", sans-serif`
  const measured = offCtx.measureText(text)
  const targetWidth = canvasWidth * textWidthRatio
  fontSize = Math.min(Math.floor(fontSize * (targetWidth / measured.width)), TEXT_MAX_FONT_SIZE)

  offCtx.clearRect(0, 0, canvasWidth, canvasHeight)
  offCtx.font = `${TEXT_FONT_WEIGHT} ${fontSize}px "Outfit", sans-serif`
  offCtx.textAlign = 'center'
  offCtx.textBaseline = 'middle'
  offCtx.fillStyle = 'black'
  offCtx.fillText(text, canvasWidth / 2, canvasHeight / 2)

  const pixels = offCtx.getImageData(0, 0, canvasWidth, canvasHeight).data
  const positions: { x: number; y: number }[] = []

  const step = 2
  for (let y = 0; y < canvasHeight; y += step) {
    for (let x = 0; x < canvasWidth; x += step) {
      if (pixels[(y * canvasWidth + x) * 4 + 3] > 128) {
        positions.push({ x, y })
      }
    }
  }

  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }

  return positions.slice(0, count)
}

// =============================================================================
// TYPES
// =============================================================================

export interface PortalConfig {
  id: string
  path: string
  color: string
  radius?: number
  label: string
}

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  color: string
  targetX?: number
  targetY?: number
  formStartX?: number
  formStartY?: number
  formDelay: number
  wobblePhase: number
  wobbleFreq: number
}

interface PortalNode extends Node {
  config: PortalConfig
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function HomeBackground({ portals }: { portals: PortalConfig[] }) {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const portalNodesRef = useRef<PortalNode[]>([])
  const animationRef = useRef<number>(0)
  const flyingPortalIdRef = useRef<string | null>(null)
  const hoveredPortalIdRef = useRef<string | null>(null)

  const [flyingPortal, setFlyingPortal] = useState<{
    config: PortalConfig
    x: number
    y: number
  } | null>(null)

  const [hoveredPortal, setHoveredPortal] = useState<{
    label: string
    x: number
    y: number
  } | null>(null)

  const handlePortalClick = (portal: PortalNode) => {
    setHoveredPortal(null)
    flyingPortalIdRef.current = portal.config.id
    setFlyingPortal({ config: portal.config, x: portal.x, y: portal.y })
    setTimeout(() => navigate(portal.config.path), NAVIGATION_DELAY)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── Canvas setup ──────────────────────────────────────────────────────

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const sphereRadius = Math.min(
      Math.min(canvas.width, canvas.height) / 2 - CANVAS_MARGIN,
      MAX_SPHERE_RADIUS,
    )
    const spawnRadius = sphereRadius * SPAWN_RADIUS_RATIO
    let startTime = performance.now()

    // ── Shared helpers ────────────────────────────────────────────────────

    const clampToScreen = (node: Node) => {
      if (node.x < 0) { node.x = 0; node.vx = Math.abs(node.vx) }
      else if (node.x > canvas.width) { node.x = canvas.width; node.vx = -Math.abs(node.vx) }
      if (node.y < 0) { node.y = 0; node.vy = Math.abs(node.vy) }
      else if (node.y > canvas.height) { node.y = canvas.height; node.vy = -Math.abs(node.vy) }
    }

    const bounceOffSphere = (node: Node) => {
      const dx = node.x - centerX
      const dy = node.y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= sphereRadius) return
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      const outAngle = Math.atan2(dy, dx)
      const newAngle = outAngle + Math.PI + (Math.random() - 0.5) * BOUNCE_ANGLE_SPREAD
      node.vx = Math.cos(newAngle) * speed
      node.vy = Math.sin(newAngle) * speed
      node.x = centerX + (dx / dist) * sphereRadius
      node.y = centerY + (dy / dist) * sphereRadius
    }

    const randomSpeed = () =>
      (Math.random() - 0.5) * NODE_SPEED *
      (NODE_SPEED_MIN_MULTIPLIER + Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER))

    // ── Create nodes ──────────────────────────────────────────────────────

    const nodes: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * spawnRadius
      const shade = Math.round(NODE_MIN_SHADE + Math.random() * (NODE_MAX_SHADE - NODE_MIN_SHADE))
      nodes.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: randomSpeed(),
        vy: randomSpeed(),
        radius: NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS),
        opacity: NODE_OPACITY,
        color: `${shade}, ${shade}, ${shade}`,
        formDelay: Math.random() * FORMATION_STAGGER,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 0.7 + Math.random() * 0.8,
      })
    }
    nodesRef.current = nodes

    // ── Create portal nodes ───────────────────────────────────────────────

    const portalNodes: PortalNode[] = portals.map((config, i) => {
      const angle = (i / portals.length) * Math.PI * 2 + Math.PI / 4
      const r = Math.random() * spawnRadius
      return {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER,
        vy: (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER,
        radius: config.radius ?? PORTAL_RADIUS,
        opacity: 0.5,
        color: config.color,
        formDelay: Math.random() * FORMATION_STAGGER,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 0.7 + Math.random() * 0.8,
        config,
      }
    })
    portalNodesRef.current = portalNodes

    // ── Precompute connection pairs ───────────────────────────────────────

    const allNodes: Node[] = [...nodes, ...portalNodes]
    const connectionEligible = new Set<string>()
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        if (Math.random() < CONNECTION_PROBABILITY) {
          connectionEligible.add(`${i}-${j}`)
        }
      }
    }

    // ── Animation state ───────────────────────────────────────────────────

    let textTargetsComputed = false
    let textBounds: { minX: number; maxX: number; minY: number; maxY: number } | null = null
    let condensingStart: number | null = null

    const isTextFullyFormed = () =>
      textTargetsComputed &&
      (performance.now() - startTime) / 1000 >= TEXT_START + FORMATION_STAGGER + TEXT_FORMATION_DURATION

    const isInTextBounds = (x: number, y: number, padding = 30) => {
      if (!textBounds) return false
      return x >= textBounds.minX - padding && x <= textBounds.maxX + padding &&
             y >= textBounds.minY - padding && y <= textBounds.maxY + padding
    }

    // ── Reset / condense helpers ──────────────────────────────────────────

    const resetAnimation = () => {
      condensingStart = performance.now()
      textTargetsComputed = false
      textBounds = null
      for (const node of nodes) {
        node.formStartX = node.x
        node.formStartY = node.y
        node.targetX = undefined
        node.targetY = undefined
      }
      for (const portal of portalNodes) {
        portal.formStartX = portal.x
        portal.formStartY = portal.y
      }
    }

    const finishCondense = () => {
      condensingStart = null
      startTime = performance.now()
      for (const node of nodes) {
        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * spawnRadius
        node.x = centerX + Math.cos(angle) * r
        node.y = centerY + Math.sin(angle) * r
        node.vx = randomSpeed()
        node.vy = randomSpeed()
        node.formDelay = Math.random() * FORMATION_STAGGER
      }
      for (const portal of portalNodes) {
        const angle = Math.random() * Math.PI * 2
        const r = Math.random() * spawnRadius
        portal.x = centerX + Math.cos(angle) * r
        portal.y = centerY + Math.sin(angle) * r
        portal.vx = (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER
        portal.vy = (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER
      }
    }

    // ── Compute text targets (called once when formation begins) ──────────

    const computeTextTargets = () => {
      const targets = sampleTextPositions(TEXT_TO_RENDER, canvas.width, canvas.height, nodes.length)
      for (let i = 0; i < nodes.length; i++) {
        const t = i < targets.length ? targets[i] : targets[Math.floor(Math.random() * targets.length)]
        nodes[i].targetX = t.x
        nodes[i].targetY = t.y
      }
      textTargetsComputed = true

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const node of nodes) {
        if (node.targetX! < minX) minX = node.targetX!
        if (node.targetX! > maxX) maxX = node.targetX!
        if (node.targetY! < minY) minY = node.targetY!
        if (node.targetY! > maxY) maxY = node.targetY!
      }
      textBounds = { minX, maxX, minY, maxY }
    }

    // ── Event handlers ────────────────────────────────────────────────────

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      for (const portal of portalNodes) {
        const dx = portal.x - x
        const dy = portal.y - y
        if (Math.sqrt(dx * dx + dy * dy) < portal.radius * PORTAL_HIT_RADIUS_MULTIPLIER) {
          handlePortalClick(portal)
          return
        }
      }

      if (isTextFullyFormed() && isInTextBounds(x, y)) {
        resetAnimation()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let foundPortal: PortalNode | null = null
      for (const portal of portalNodes) {
        const dx = portal.x - x
        const dy = portal.y - y
        if (Math.sqrt(dx * dx + dy * dy) < portal.radius * PORTAL_HIT_RADIUS_MULTIPLIER) {
          foundPortal = portal
          break
        }
      }

      const overText = isTextFullyFormed() && isInTextBounds(x, y)
      canvas.style.cursor = (foundPortal || overText) ? 'pointer' : 'default'

      if (foundPortal) {
        hoveredPortalIdRef.current = foundPortal.config.id
        setHoveredPortal({ label: foundPortal.config.label, x: foundPortal.x, y: foundPortal.y })
      } else {
        hoveredPortalIdRef.current = null
        setHoveredPortal(null)
      }
    }

    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('mousemove', handleMouseMove)

    // ══════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ══════════════════════════════════════════════════════════════════════

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Condense phase ──────────────────────────────────────────────────
      // Nodes lerp toward center, then the whole animation restarts.

      if (condensingStart !== null) {
        const condenseT = (performance.now() - condensingStart) / 1000

        if (condenseT >= CONDENSE_DURATION) {
          finishCondense()
          // fall through to normal animation below
        } else {
          const progress = condenseT / CONDENSE_DURATION
          const eased = progress * progress

          for (const node of nodes) {
            node.x = node.formStartX! + (centerX - node.formStartX!) * eased
            node.y = node.formStartY! + (centerY - node.formStartY!) * eased
            drawSphereNode(ctx, node.x, node.y, node.radius, node.color, node.opacity)
          }
          for (const portal of portalNodes) {
            if (flyingPortalIdRef.current === portal.config.id) continue
            portal.x = portal.formStartX! + (centerX - portal.formStartX!) * eased
            portal.y = portal.formStartY! + (centerY - portal.formStartY!) * eased
            const isHovered = hoveredPortalIdRef.current === portal.config.id
            drawSphereNode(ctx, portal.x, portal.y, portal.radius, portal.config.color, isHovered ? PORTAL_HOVER_OPACITY : PORTAL_OPACITY)
          }

          animationRef.current = requestAnimationFrame(animate)
          return
        }
      }

      // ── Normal animation ────────────────────────────────────────────────

      const elapsed = (performance.now() - startTime) / 1000
      const forming = elapsed >= TEXT_START

      if (forming && !textTargetsComputed) {
        computeTextTargets()
      }

      // ── Connections ─────────────────────────────────────────────────────
      // Fade out as text forms; skip entirely once fully faded.

      let connectionFade = 1
      if (forming && textTargetsComputed) {
        const textT = Math.min((elapsed - TEXT_START) / TEXT_FORMATION_DURATION, 1)
        connectionFade = Math.max(0, 1 - textT * 1.5)
      }

      if (connectionFade > 0.001) {
        for (let i = 0; i < allNodes.length; i++) {
          for (let j = i + 1; j < allNodes.length; j++) {
            if (!connectionEligible.has(`${i}-${j}`)) continue

            const dx = allNodes[i].x - allNodes[j].x
            const dy = allNodes[i].y - allNodes[j].y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance >= CONNECTION_DISTANCE) continue

            const opacity = (1 - distance / CONNECTION_DISTANCE) * CONNECTION_OPACITY * connectionFade
            ctx.beginPath()
            ctx.moveTo(allNodes[i].x, allNodes[i].y)
            ctx.lineTo(allNodes[j].x, allNodes[j].y)
            ctx.strokeStyle = `rgba(${CONNECTION_COLOR}, ${opacity})`
            ctx.lineWidth = CONNECTION_LINE_WIDTH
            ctx.stroke()
          }
        }
      }

      // ── Update & draw nodes ─────────────────────────────────────────────
      // Three flat phases per node: drift → formation → wobble.

      for (const node of nodes) {
        const nodeStart = TEXT_START + node.formDelay
        const textT = (elapsed >= nodeStart && textTargetsComputed && node.targetX !== undefined)
          ? Math.min((elapsed - nodeStart) / TEXT_FORMATION_DURATION, 1)
          : 0

        // Drift phase: bounce off sphere during sphere phase, then screen edges
        if (textT === 0) {
          node.x += node.vx
          node.y += node.vy
          if (elapsed < SPHERE_DURATION) {
            bounceOffSphere(node)
          }
          clampToScreen(node)
          drawSphereNode(ctx, node.x, node.y, node.radius, node.color, node.opacity)
          continue
        }

        // Capture start position on first formation frame
        if (node.formStartX === undefined) {
          node.formStartX = node.x
          node.formStartY = node.y
        }

        const eased = 1 - Math.pow(1 - textT, 3) // easeOutCubic

        // Wobble phase: formation complete, gentle oscillation around target
        if (textT >= 1) {
          const p = node.wobblePhase
          const f = node.wobbleFreq
          node.x = node.targetX!
            + Math.sin(elapsed * TEXT_WOBBLE_SPEED * f + p) * TEXT_WOBBLE_RADIUS
            + Math.sin(elapsed * TEXT_WOBBLE_SPEED * f * 2.3 + p * 1.7) * TEXT_WOBBLE_RADIUS * 0.3
          node.y = node.targetY!
            + Math.cos(elapsed * TEXT_WOBBLE_SPEED * f * 1.3 + p * 0.8) * TEXT_WOBBLE_RADIUS
            + Math.cos(elapsed * TEXT_WOBBLE_SPEED * f * 0.7 + p * 2.1) * TEXT_WOBBLE_RADIUS * 0.4
          drawSphereNode(ctx, node.x, node.y, node.radius, node.color, node.opacity)
          continue
        }

        // Formation phase: lerp toward target with decaying wander
        const wander = (1 - eased) * FORMATION_WANDER_STRENGTH
        node.vx += (Math.random() - 0.5) * wander
        node.vy += (Math.random() - 0.5) * wander
        node.vx *= FORMATION_VELOCITY_DECAY
        node.vy *= FORMATION_VELOCITY_DECAY
        node.formStartX += node.vx
        node.formStartY! += node.vy
        node.x = node.formStartX + (node.targetX! - node.formStartX) * eased
        node.y = node.formStartY! + (node.targetY! - node.formStartY!) * eased
        drawSphereNode(ctx, node.x, node.y, node.radius, node.color, node.opacity)
      }

      // ── Update & draw portals ───────────────────────────────────────────

      for (const portal of portalNodes) {
        if (flyingPortalIdRef.current === portal.config.id) continue

        portal.x += portal.vx
        portal.y += portal.vy
        if (elapsed < SPHERE_DURATION) {
          bounceOffSphere(portal)
        }
        clampToScreen(portal)

        const isHovered = hoveredPortalIdRef.current === portal.config.id
        const coreOpacity = isHovered ? PORTAL_HOVER_OPACITY : PORTAL_OPACITY
        const glowOpacity = isHovered ? PORTAL_HOVER_GLOW_OPACITY : PORTAL_GLOW_OPACITY

        drawSphereNode(ctx, portal.x, portal.y, portal.radius * PORTAL_GLOW_RADIUS_MULTIPLIER, portal.config.color, glowOpacity)
        drawSphereNode(ctx, portal.x, portal.y, portal.radius, portal.config.color, coreOpacity)
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

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div
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

      {/* Edge vignette shadow */}
      <div
        className="fixed inset-0 z-[5] pointer-events-none"
        style={{
          boxShadow: `inset 0 0 ${EDGE_SHADOW_SIZE}px ${Math.round(EDGE_SHADOW_SIZE / 2.5)}px rgba(0, 0, 0, ${EDGE_SHADOW_OPACITY})`,
        }}
      />

      {/* Flying circle — scales up as it flies off screen top */}
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
