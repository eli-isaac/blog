// Activation functions
export const activations = {
  none: { 
    fn: x => x, 
    dfn: () => 1 
  },
  relu: { 
    fn: x => Math.max(0, x), 
    dfn: x => x > 0 ? 1 : 0 
  },
  sigmoid: { 
    fn: x => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))), 
    dfn: x => { 
      const s = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))))
      return s * (1 - s) 
    } 
  },
  tanh: { 
    fn: x => Math.tanh(x), 
    dfn: x => 1 - Math.tanh(x) ** 2 
  },
}

// Create a network with given architecture
export function createNetwork(hiddenSize = 8, inputSize = 2, outputSize = 1) {
  const rand = () => (Math.random() - 0.5) * 2
  return {
    inputSize,
    hiddenSize,
    outputSize,
    w1: Array(inputSize).fill(0).map(() => Array(hiddenSize).fill(0).map(rand)),
    b1: Array(hiddenSize).fill(0).map(rand),
    w2: Array(hiddenSize).fill(0).map(() => Array(outputSize).fill(0).map(rand)),
    b2: Array(outputSize).fill(0).map(rand),
  }
}

// Forward pass
export function forward(net, x, activation) {
  const { fn } = activations[activation]
  
  // Hidden layer
  const hidden = net.b1.map((b, j) => {
    let sum = b
    for (let i = 0; i < net.inputSize; i++) sum += x[i] * net.w1[i][j]
    return sum
  })
  const hiddenAct = hidden.map(fn)
  
  // Output layer (softmax for multi-class, sigmoid for binary)
  const out = net.b2.map((b, k) => {
    let sum = b
    for (let j = 0; j < net.hiddenSize; j++) sum += hiddenAct[j] * net.w2[j][k]
    return sum
  })
  
  let outAct
  if (net.outputSize === 1) {
    // Binary: sigmoid
    outAct = out.map(o => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, o)))))
  } else {
    // Multi-class: softmax
    const maxOut = Math.max(...out)
    const expOut = out.map(o => Math.exp(o - maxOut))
    const sumExp = expOut.reduce((a, b) => a + b, 0)
    outAct = expOut.map(e => e / sumExp)
  }
  
  return { hidden, hiddenAct, out, outAct }
}

// Backward pass and weight update
function backward(net, x, y, activation, lr = 0.05) {
  const { dfn } = activations[activation]
  const { hidden, hiddenAct, outAct } = forward(net, x, activation)
  
  // Convert y to one-hot if needed
  const target = Array.isArray(y) ? y : (net.outputSize === 1 ? [y] : oneHot(y, net.outputSize))
  
  // Output gradient (cross-entropy derivative for softmax/sigmoid)
  const dOut = outAct.map((o, k) => o - target[k])
  
  // Update output weights
  for (let k = 0; k < net.outputSize; k++) {
    net.b2[k] -= lr * dOut[k]
    for (let j = 0; j < net.hiddenSize; j++) {
      net.w2[j][k] -= lr * dOut[k] * hiddenAct[j]
    }
  }
  
  // Hidden layer gradients
  for (let j = 0; j < net.hiddenSize; j++) {
    let dHidden = 0
    for (let k = 0; k < net.outputSize; k++) {
      dHidden += dOut[k] * net.w2[j][k]
    }
    dHidden *= dfn(hidden[j])
    
    net.b1[j] -= lr * dHidden
    for (let i = 0; i < net.inputSize; i++) {
      net.w1[i][j] -= lr * dHidden * x[i]
    }
  }
  
  // Return loss (cross-entropy)
  let loss = 0
  for (let k = 0; k < net.outputSize; k++) {
    loss -= target[k] * Math.log(outAct[k] + 1e-10)
  }
  return loss
}

function oneHot(index, size) {
  const arr = Array(size).fill(0)
  arr[index] = 1
  return arr
}

// Train one epoch
export function trainStep(net, data, activation, outputSize) {
  let totalLoss = 0
  const shuffled = [...data].sort(() => Math.random() - 0.5)
  for (const { x, y } of shuffled) {
    totalLoss += backward(net, x, y, activation, 0.005)
  }
  return totalLoss / data.length
}

// Get prediction (class index for multi-class, probability for binary)
export function predict(net, x, activation) {
  const { outAct } = forward(net, x, activation)
  if (net.outputSize === 1) {
    return outAct[0]
  }
  return outAct.indexOf(Math.max(...outAct))
}

