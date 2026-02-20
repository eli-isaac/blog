import type { DataPoint } from './network'

export interface Problem {
  id: string
  name: string
  description: string
  explanation: string
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
    description: 'Can the network learn that opposite corners belong together?',
    explanation: 'Each dot has two coordinates. White dots belong to one group, dark dots to another — and the groups sit in opposite corners. The background color shows what the network currently predicts: reddish means group 0, bluish means group 1. A straight line can never separate opposite corners, so a network without an activation function will fail here.',
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
    description: 'A simple problem — no activation function needed.',
    explanation: 'Each cell shows a pair of numbers to add (e.g. 2+3). The bold number is the network\'s predicted answer. Green means correct, red means wrong. Addition is straightforward — each input contributes independently to the sum — so even a network with no activation function can learn it.',
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
    description: 'Harder than addition — the network needs an activation function.',
    explanation: 'Same layout as addition, but now the network must learn to multiply. The bold number is the predicted product; green means correct, red means wrong. Unlike addition, multiplication requires the inputs to interact — 3×2 is not just "3 plus something." This makes it fundamentally harder, and a network with no activation function will plateau with many red cells.',
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
    description: 'Can the network learn to draw a circular boundary?',
    explanation: 'White dots are inside a circle, dark dots are outside. The background shows the network\'s prediction — bluish for "outside," reddish for "inside." No single straight line can separate a circle from its surroundings, so a network without an activation function will fail here.',
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
