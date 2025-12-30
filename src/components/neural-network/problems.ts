import type { DataPoint } from './network'

export interface Problem {
  id: string
  name: string
  description: string
  inputSize: number
  hiddenSize: number
  outputSize: number
  visualType: '2d-binary' | 'grid'
  generateData: () => DataPoint[]
}

// Toy problem definitions
export const problems: Problem[] = [
  {
    id: 'xor',
    name: 'XOR Classification',
    description: 'Non-linearly separable. Linear networks fail.',
    inputSize: 2,
    hiddenSize: 8,
    outputSize: 1,
    visualType: '2d-binary',
    generateData: () => {
      const data: DataPoint[] = []
      for (let i = 0; i < 100; i++) {
        const x1 = Math.random() * 2 - 1
        const x2 = Math.random() * 2 - 1
        const y = (x1 > 0) !== (x2 > 0) ? 1 : 0
        data.push({ x: [x1, x2], y })
      }
      return data
    }
  },
  {
    id: 'addition',
    name: 'Addition (0-4)',
    description: 'Linear problem. Even linear networks can learn this.',
    inputSize: 2,
    hiddenSize: 8,
    outputSize: 9, // 0+0=0 to 4+4=8
    visualType: 'grid',
    generateData: () => {
      const data: DataPoint[] = []
      for (let a = 0; a <= 4; a++) {
        for (let b = 0; b <= 4; b++) {
          // Normalize inputs to [-1, 1]
          data.push({ x: [a / 2 - 1, b / 2 - 1], y: a + b })
        }
      }
      return data
    }
  },
  {
    id: 'multiplication',
    name: 'Multiplication (0-4)',
    description: 'Non-linear problem. Requires activation functions.',
    inputSize: 2,
    hiddenSize: 16,
    outputSize: 17, // 0*0=0 to 4*4=16
    visualType: 'grid',
    generateData: () => {
      const data: DataPoint[] = []
      for (let a = 0; a <= 4; a++) {
        for (let b = 0; b <= 4; b++) {
          data.push({ x: [a / 2 - 1, b / 2 - 1], y: a * b })
        }
      }
      return data
    }
  },
  {
    id: 'circle',
    name: 'Circle Classification',
    description: 'Points inside vs outside. Non-linear boundary.',
    inputSize: 2,
    hiddenSize: 8,
    outputSize: 1,
    visualType: '2d-binary',
    generateData: () => {
      const data: DataPoint[] = []
      for (let i = 0; i < 100; i++) {
        const x1 = Math.random() * 2 - 1
        const x2 = Math.random() * 2 - 1
        const y = (x1 * x1 + x2 * x2) < 0.5 ? 1 : 0
        data.push({ x: [x1, x2], y })
      }
      return data
    }
  },
]
