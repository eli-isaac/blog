import { useEffect, useRef, useCallback } from 'react'
import { useNeuralNetwork } from './context'
import { forward, predict, Network, ActivationType } from './network'
import type { Problem } from './problems'

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, currentProblem, activation, tick } = useNeuralNetwork()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    
    ctx.clearRect(0, 0, w, h)

    if (currentProblem.visualType === '2d-binary') {
      draw2DBinary(ctx, w, h, state.network, state.data, activation)
    } else if (currentProblem.visualType === 'grid') {
      drawGrid(ctx, w, h, state.network, activation, currentProblem)
    }
  }, [state, currentProblem, activation, tick])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={280}
      className="border border-gray-200 rounded bg-transparent mx-auto block"
    />
  )
}

interface DataPoint {
  x: number[]
  y: number | number[]
}

function draw2DBinary(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  network: Network, 
  data: DataPoint[], 
  activation: ActivationType
) {
  const res = 4
  
  // Draw decision boundary
  for (let px = 0; px < w; px += res) {
    for (let py = 0; py < h; py += res) {
      const x = (px / w) * 2 - 1
      const y = -((py / h) * 2 - 1)
      const { outAct } = forward(network, [x, y], activation)
      const p = outAct[0]
      const r = Math.floor((1 - p) * 100 + p * 239)
      const g = Math.floor((1 - p) * 100 + p * 68)
      const b = Math.floor((1 - p) * 200 + p * 68)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fillRect(px, py, res, res)
    }
  }
  
  // Draw data points
  data.forEach(({ x, y }) => {
    const px = (x[0] + 1) / 2 * w
    const py = (-x[1] + 1) / 2 * h
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = y === 1 ? '#fff' : '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

function drawGrid(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  network: Network, 
  activation: ActivationType, 
  problem: Problem
) {
  const cellW = w / 5
  const cellH = h / 5
  
  // Draw grid cells with predictions
  for (let a = 0; a <= 4; a++) {
    for (let b = 0; b <= 4; b++) {
      const x = [a / 2 - 1, b / 2 - 1]
      const pred = predict(network, x, activation)
      const actual = problem.id === 'addition' ? a + b : a * b
      const correct = pred === actual
      
      const px = a * cellW
      const py = (4 - b) * cellH
      
      // Background
      ctx.fillStyle = correct ? '#dcfce7' : '#fee2e2'
      ctx.fillRect(px, py, cellW, cellH)
      
      // Border
      ctx.strokeStyle = '#e5e7eb'
      ctx.strokeRect(px, py, cellW, cellH)
      
      // Text
      ctx.fillStyle = '#374151'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const label = problem.id === 'addition' ? `${a}+${b}` : `${a}×${b}`
      ctx.fillText(label, px + cellW / 2, py + cellH / 3)
      
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = correct ? '#16a34a' : '#dc2626'
      ctx.fillText(pred.toString(), px + cellW / 2, py + cellH * 2 / 3)
    }
  }
}
