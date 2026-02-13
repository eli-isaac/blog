import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// =============================================================================
// CONFIGURATION
// =============================================================================

// Background
const BACKGROUND_COLOR = '#efefe2'

// Construct boundary
const CANVAS_MARGIN = 100 // Inset from screen edge; radius = min(w,h)/2 - margin
const MAX_CONSTRUCT_RADIUS = 270 // Max radius of the construct circle (px)
const SPAWN_RADIUS_RATIO = 0.05 // Fraction of construct radius nodes start in
const SPHERE_DURATION = 14 // Seconds nodes bounce inside the sphere
const EXPANSION_DURATION = 5 // Seconds for sphere boundary to expand to full screen
const SCATTER_DURATION = 7 // Seconds nodes float freely before text forms
const TEXT_FORMATION_DURATION = 7 // Seconds for nodes to lerp into text positions
const FORMATION_STAGGER = 5 // Seconds over which node start times are spread
const FORMATION_VELOCITY_DECAY = 0.97 // Velocity retention per frame during formation
const FORMATION_WANDER_STRENGTH = 1 // Random velocity impulse during formation (fades to 0)
// Derived: total seconds before text formation begins
const TEXT_START = SPHERE_DURATION + EXPANSION_DURATION + SCATTER_DURATION
const CONDENSE_DURATION = 1.2 // Seconds for nodes to scrunch back to center on reset
const TEXT_WOBBLE_SPEED = 5 // Speed of gentle wobble after text forms
const TEXT_WOBBLE_RADIUS = 0.6 // Max wobble distance from target (px)
const TEXT_TO_RENDER = 'ARROWSMITH'
const TEXT_WIDTH_RATIO_MOBILE = 0.92 // Text width as fraction of canvas width on mobile
const TEXT_WIDTH_RATIO_DESKTOP = 0.4 // Text width as fraction of canvas width on desktop
const TEXT_MAX_FONT_SIZE = 400 // Cap on computed font size (px)
const TEXT_FONT_WEIGHT = 400 // Lighter weight for thinner letter strokes

// Node settings
const NODE_COUNT_MOBILE = 450
const NODE_COUNT_DESKTOP = 500
const NODE_COUNT = window.innerWidth < 768 ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP
const NODE_MIN_RADIUS_MOBILE = 2
const NODE_MAX_RADIUS_MOBILE = 3
const NODE_MIN_RADIUS_DESKTOP = 4
const NODE_MAX_RADIUS_DESKTOP = 7
const NODE_MIN_RADIUS = window.innerWidth < 768 ? NODE_MIN_RADIUS_MOBILE : NODE_MIN_RADIUS_DESKTOP
const NODE_MAX_RADIUS = window.innerWidth < 768 ? NODE_MAX_RADIUS_MOBILE : NODE_MAX_RADIUS_DESKTOP
const NODE_OPACITY = 0.7
const NODE_MIN_SHADE = 140 // Darker grey
const NODE_MAX_SHADE = 210 // Lighter grey

// Movement settings
const NODE_SPEED_MOBILE = 0.45
const NODE_SPEED_DESKTOP = 1
const NODE_SPEED = window.innerWidth < 768 ? NODE_SPEED_MOBILE : NODE_SPEED_DESKTOP
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

// Hover highlight settings (for regular nodes and edges near cursor)
const HOVER_DISTANCE = 40 // How close cursor needs to be to highlight (px)
const HOVER_OPACITY_REDUCTION = 0.5 // How much opacity drops near cursor (0 = no change, 1 = invisible)
const SPEED_RECOVERY_RATE = 0.0005 // How fast nodes return to original speed after perturbation (0–1)

// Connection settings
const CONNECTION_DISTANCE = 300
const CONNECTION_PROBABILITY = 0.08 // Probability a valid pair is connected (0–1)
const CONNECTION_OPACITY = 0.13
const CONNECTION_LINE_WIDTH = .8
const CONNECTION_COLOR = '100, 100, 100'

// Edge vignette shadow
const EDGE_SHADOW_SIZE = 200 // Shadow blur radius from edges (px)
const EDGE_SHADOW_OPACITY = 0.15 // Shadow darkness at edges

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
// TEXT POSITION SAMPLING
// =============================================================================

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

  // Calculate font size so text fills ~textWidthRatio of canvas width
  let fontSize = 200
  offCtx.font = `${TEXT_FONT_WEIGHT} ${fontSize}px "Outfit", sans-serif`
  const measured = offCtx.measureText(text)
  const targetWidth = canvasWidth * textWidthRatio
  fontSize = Math.floor(fontSize * (targetWidth / measured.width))
  fontSize = Math.min(fontSize, TEXT_MAX_FONT_SIZE)

  offCtx.clearRect(0, 0, canvasWidth, canvasHeight)
  offCtx.font = `${TEXT_FONT_WEIGHT} ${fontSize}px "Outfit", sans-serif`
  offCtx.textAlign = 'center'
  offCtx.textBaseline = 'middle'
  offCtx.fillStyle = 'black'
  offCtx.fillText(text, canvasWidth / 2, canvasHeight / 2)

  const imageData = offCtx.getImageData(0, 0, canvasWidth, canvasHeight)
  const pixels = imageData.data
  const positions: { x: number; y: number }[] = []

  const step = 2
  for (let y = 0; y < canvasHeight; y += step) {
    for (let x = 0; x < canvasWidth; x += step) {
      const idx = (y * canvasWidth + x) * 4
      if (pixels[idx + 3] > 128) {
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
  baseSpeed: number // original speed magnitude to recover toward
  radius: number
  opacity: number
  color: string // per-node RGB shade string
  targetX?: number // text formation target x
  targetY?: number // text formation target y
  formStartX?: number // position when this node's formation began
  formStartY?: number
  formDelay: number // random stagger delay for text formation start
  wobblePhase: number // random phase offset for post-formation wobble
  wobbleFreq: number // random frequency multiplier for wobble
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
  // Mouse position ref for hover highlighting in animation loop
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

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
    const sphereRadius = Math.min(
      Math.min(canvas.width, canvas.height) / 2 - CANVAS_MARGIN,
      MAX_CONSTRUCT_RADIUS,
    )
    // Full-screen radius: distance from center to the farthest corner
    const fullScreenRadius = Math.sqrt(centerX * centerX + centerY * centerY)
    let startTime = performance.now()

    // Create regular nodes — spawned bunched near the center, they drift outward naturally
    const SPAWN_RADIUS = sphereRadius * SPAWN_RADIUS_RATIO
    const nodes: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * SPAWN_RADIUS
      const vx = (Math.random() - 0.5) * NODE_SPEED * (NODE_SPEED_MIN_MULTIPLIER + Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER))
      const vy = (Math.random() - 0.5) * NODE_SPEED * (NODE_SPEED_MIN_MULTIPLIER + Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER))
      const s = Math.round(NODE_MIN_SHADE + Math.random() * (NODE_MAX_SHADE - NODE_MIN_SHADE))
      nodes.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx,
        vy,
        baseSpeed: Math.sqrt(vx * vx + vy * vy),
        radius: NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS),
        opacity: NODE_OPACITY,
        color: `${s}, ${s}, ${s}`,
        formDelay: Math.random() * FORMATION_STAGGER,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 0.7 + Math.random() * 0.8,
      })
    }
    nodesRef.current = nodes

    // Create portal nodes - start near center, drift outward with the rest
    const portalNodes: PortalNode[] = portals.map((config, index) => {
      const angle = (index / portals.length) * Math.PI * 2 + Math.PI / 4
      const r = Math.random() * SPAWN_RADIUS
      
      const pvx = (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER
      const pvy = (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER
      return {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: pvx,
        vy: pvy,
        baseSpeed: Math.sqrt(pvx * pvx + pvy * pvy),
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

      // Portal clicks take priority
      for (const portal of portalNodes) {
        const dx = portal.x - x
        const dy = portal.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < portal.radius * PORTAL_HIT_RADIUS_MULTIPLIER) {
          handlePortalClick(portal)
          return
        }
      }

      // Click on fully formed text → reset animation
      if (isTextFullyFormed() && isInTextBounds(x, y)) {
        resetAnimation()
      }
    }
    canvas.addEventListener('click', handleClick)

    // Cursor and hover handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      mouseRef.current = { x, y }

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
      
      // Pointer cursor for portals or clickable formed text
      const overText = isTextFullyFormed() && isInTextBounds(x, y)
      canvas.style.cursor = (foundPortal || overText) ? 'pointer' : 'default'
      
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

    const handleMouseLeave = () => {
      mouseRef.current = null
    }
    canvas.addEventListener('mouseleave', handleMouseLeave)

    // Point-to-line-segment distance for edge hover detection
    const pointToSegmentDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
      const abx = bx - ax, aby = by - ay
      const apx = px - ax, apy = py - ay
      const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)))
      const cx = ax + t * abx, cy = ay + t * aby
      const dx = px - cx, dy = py - cy
      return Math.sqrt(dx * dx + dy * dy)
    }

    let textTargetsComputed = false
    let textBounds: { minX: number; maxX: number; minY: number; maxY: number } | null = null
    const TEXT_FULLY_FORMED_TIME = () => TEXT_START + FORMATION_STAGGER + TEXT_FORMATION_DURATION

    // Check if all nodes have finished forming
    const isTextFullyFormed = () => {
      return textTargetsComputed && (performance.now() - startTime) / 1000 >= TEXT_FULLY_FORMED_TIME()
    }

    // Check if a point is inside the text bounding box (with padding)
    const isInTextBounds = (x: number, y: number, padding = 30) => {
      if (!textBounds) return false
      return x >= textBounds.minX - padding && x <= textBounds.maxX + padding &&
             y >= textBounds.minY - padding && y <= textBounds.maxY + padding
    }

    // Condense state
    let condensingStart: number | null = null

    // Start condensing: nodes scrunch toward center, then restart
    const resetAnimation = () => {
      condensingStart = performance.now()
      textTargetsComputed = false
      textBounds = null
      // Capture current positions as condense start, clear formation data
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

    // Finish condense: snap nodes to center ball and restart timer
    const finishCondense = () => {
      condensingStart = null
      startTime = performance.now()
      for (const node of nodes) {
        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * SPAWN_RADIUS
        node.x = centerX + Math.cos(angle) * r
        node.y = centerY + Math.sin(angle) * r
        const vx = (Math.random() - 0.5) * NODE_SPEED * (NODE_SPEED_MIN_MULTIPLIER + Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER))
        const vy = (Math.random() - 0.5) * NODE_SPEED * (NODE_SPEED_MIN_MULTIPLIER + Math.random() * (NODE_SPEED_MAX_MULTIPLIER - NODE_SPEED_MIN_MULTIPLIER))
        node.vx = vx
        node.vy = vy
        node.baseSpeed = Math.sqrt(vx * vx + vy * vy)
        node.formDelay = Math.random() * FORMATION_STAGGER
      }
      for (const portal of portalNodes) {
        const angle = Math.random() * Math.PI * 2
        const r = Math.random() * SPAWN_RADIUS
        portal.x = centerX + Math.cos(angle) * r
        portal.y = centerY + Math.sin(angle) * r
        const pvx = (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER
        const pvy = (Math.random() - 0.5) * NODE_SPEED * PORTAL_SPEED_MULTIPLIER
        portal.vx = pvx
        portal.vy = pvy
        portal.baseSpeed = Math.sqrt(pvx * pvx + pvy * pvy)
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // --- CONDENSE PHASE: pull everything toward center then restart ---
      if (condensingStart !== null) {
        const condenseElapsed = (performance.now() - condensingStart) / 1000
        if (condenseElapsed >= CONDENSE_DURATION) {
          finishCondense()
        } else {
          // Simple lerp toward center — no velocity, no oscillation
          const t = condenseElapsed / CONDENSE_DURATION
          const eased = t * t // easeIn — accelerates into the center

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
          return // skip normal animation during condense
        }
      }

      // Compute elapsed time and determine animation phase
      const elapsed = (performance.now() - startTime) / 1000
      const textPhaseActive = elapsed >= TEXT_START

      // Compute text targets once when text phase begins
      if (textPhaseActive && !textTargetsComputed) {
        const targets = sampleTextPositions(TEXT_TO_RENDER, canvas.width, canvas.height, nodes.length)
        for (let i = 0; i < nodes.length; i++) {
          if (i < targets.length) {
            nodes[i].targetX = targets[i].x
            nodes[i].targetY = targets[i].y
          } else {
            const rt = targets[Math.floor(Math.random() * targets.length)]
            nodes[i].targetX = rt.x
            nodes[i].targetY = rt.y
          }
        }
        textTargetsComputed = true

        // Compute text bounding box for click detection
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const node of nodes) {
          if (node.targetX !== undefined) {
            if (node.targetX < minX) minX = node.targetX
            if (node.targetX > maxX) maxX = node.targetX
            if (node.targetY! < minY) minY = node.targetY!
            if (node.targetY! > maxY) maxY = node.targetY!
          }
        }
        textBounds = { minX, maxX, minY, maxY }
      }

      // Construct radius: sphere → expand → full screen (stays full for scatter + text)
      let constructRadius: number
      if (elapsed < SPHERE_DURATION) {
        constructRadius = sphereRadius
      } else if (elapsed < SPHERE_DURATION + EXPANSION_DURATION) {
        const t = (elapsed - SPHERE_DURATION) / EXPANSION_DURATION
        const eased = 1 - (1 - t) * (1 - t)
        constructRadius = sphereRadius + (fullScreenRadius - sphereRadius) * eased
      } else {
        constructRadius = fullScreenRadius
      }

      const allNodes = [...nodes, ...portalNodes]
      const mouse = mouseRef.current

      // Fade out connections as text forms
      let connectionFade = 1
      if (textPhaseActive && textTargetsComputed) {
        const textT = Math.min((elapsed - TEXT_START) / TEXT_FORMATION_DURATION, 1)
        connectionFade = Math.max(0, 1 - textT * 1.5) // fade out faster than formation
      }

      // Draw connections (only for pre-selected eligible pairs) — skip entirely once faded
      if (connectionFade > 0.001) for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          if (!connectionEligible.has(`${i}-${j}`)) continue

          const dx = allNodes[i].x - allNodes[j].x
          const dy = allNodes[i].y - allNodes[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < CONNECTION_DISTANCE) {
            let opacity = (1 - distance / CONNECTION_DISTANCE) * CONNECTION_OPACITY * connectionFade

            // Reduce opacity if cursor is near this edge
            if (mouse) {
              const dist = pointToSegmentDist(mouse.x, mouse.y, allNodes[i].x, allNodes[i].y, allNodes[j].x, allNodes[j].y)
              if (dist < HOVER_DISTANCE) {
                const proximity = 1 - dist / HOVER_DISTANCE
                opacity *= 1 - proximity * HOVER_OPACITY_REDUCTION
              }
            }

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
        // Per-node staggered formation progress
        const nodeStart = TEXT_START + node.formDelay
        const textT = (elapsed >= nodeStart && textTargetsComputed && node.targetX !== undefined)
          ? Math.min((elapsed - nodeStart) / TEXT_FORMATION_DURATION, 1)
          : 0

        if (textT > 0) {
          // Capture this node's start position on its first formation frame
          if (node.formStartX === undefined) {
            node.formStartX = node.x
            node.formStartY = node.y
          }

          // easeOutCubic — no midpoint acceleration, just smooth deceleration
          const eased = 1 - Math.pow(1 - textT, 3)

          if (textT < 1) {
            // Random wander impulse that fades out
            const wander = (1 - eased) * FORMATION_WANDER_STRENGTH
            node.vx += (Math.random() - 0.5) * wander
            node.vy += (Math.random() - 0.5) * wander

            // Decay velocity and drift formStart for natural curving
            node.vx *= FORMATION_VELOCITY_DECAY
            node.vy *= FORMATION_VELOCITY_DECAY
            node.formStartX += node.vx
            node.formStartY! += node.vy

            // Lerp from drifting start to target
            node.x = node.formStartX + (node.targetX! - node.formStartX) * eased
            node.y = node.formStartY! + (node.targetY! - node.formStartY!) * eased
          } else {
            // Formation complete — per-node randomised wobble
            const p = node.wobblePhase
            const f = node.wobbleFreq
            node.x = node.targetX!
              + Math.sin(elapsed * TEXT_WOBBLE_SPEED * f + p) * TEXT_WOBBLE_RADIUS
              + Math.sin(elapsed * TEXT_WOBBLE_SPEED * f * 2.3 + p * 1.7) * TEXT_WOBBLE_RADIUS * 0.3
            node.y = node.targetY!
              + Math.cos(elapsed * TEXT_WOBBLE_SPEED * f * 1.3 + p * 0.8) * TEXT_WOBBLE_RADIUS
              + Math.cos(elapsed * TEXT_WOBBLE_SPEED * f * 0.7 + p * 2.1) * TEXT_WOBBLE_RADIUS * 0.4
          }

          drawSphereNode(ctx, node.x, node.y, node.radius, node.color, node.opacity)
        } else {
          // SCATTER / SPHERE PHASE: normal physics
          node.x += node.vx
          node.y += node.vy

          // Bounce off circular boundary
          const ndx = node.x - centerX
          const ndy = node.y - centerY
          const nDist = Math.sqrt(ndx * ndx + ndy * ndy)
          if (nDist > constructRadius) {
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
            const outAngle = Math.atan2(ndy, ndx)
            const newAngle = outAngle + Math.PI + (Math.random() - 0.5) * BOUNCE_ANGLE_SPREAD
            node.vx = Math.cos(newAngle) * speed
            node.vy = Math.sin(newAngle) * speed
            node.x = centerX + (ndx / nDist) * constructRadius
            node.y = centerY + (ndy / nDist) * constructRadius
          }

          // Clamp to screen edges
          if (node.x < 0) { node.x = 0; node.vx = Math.abs(node.vx) }
          else if (node.x > canvas.width) { node.x = canvas.width; node.vx = -Math.abs(node.vx) }
          if (node.y < 0) { node.y = 0; node.vy = Math.abs(node.vy) }
          else if (node.y > canvas.height) { node.y = canvas.height; node.vy = -Math.abs(node.vy) }

          // Hover: reduce opacity near cursor
          let opacity = node.opacity
          if (mouse) {
            const dx = node.x - mouse.x
            const dy = node.y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < HOVER_DISTANCE) {
              const proximity = 1 - dist / HOVER_DISTANCE
              opacity *= 1 - proximity * HOVER_OPACITY_REDUCTION
            }
          }

          // Gently recover speed toward original baseSpeed
          const currentSpeed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
          if (currentSpeed > 0) {
            const recoveredSpeed = currentSpeed + (node.baseSpeed - currentSpeed) * SPEED_RECOVERY_RATE
            const scale = recoveredSpeed / currentSpeed
            node.vx *= scale
            node.vy *= scale
          }

          drawSphereNode(ctx, node.x, node.y, node.radius, node.color, opacity)
        }
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

        // Clamp to screen edges
        if (portal.x < 0) { portal.x = 0; portal.vx = Math.abs(portal.vx) }
        else if (portal.x > canvas.width) { portal.x = canvas.width; portal.vx = -Math.abs(portal.vx) }
        if (portal.y < 0) { portal.y = 0; portal.vy = Math.abs(portal.vy) }
        else if (portal.y > canvas.height) { portal.y = canvas.height; portal.vy = -Math.abs(portal.vy) }

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
      canvas.removeEventListener('mouseleave', handleMouseLeave)
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

      {/* Edge vignette shadow */}
      <div
        className="fixed inset-0 z-[5] pointer-events-none"
        style={{
          boxShadow: `inset 0 0 ${EDGE_SHADOW_SIZE}px ${Math.round(EDGE_SHADOW_SIZE / 2.5)}px rgba(0, 0, 0, ${EDGE_SHADOW_OPACITY})`,
        }}
      />

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
