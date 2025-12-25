import { Mafs, Coordinates, Plot, Theme } from 'mafs'
import 'mafs/core.css'

const activationFunctions = {
  step: (x) => x >= 0 ? 1 : 0,
  sigmoid: (x) => 1 / (1 + Math.exp(-x)),
  tanh: (x) => Math.tanh(x),
  relu: (x) => Math.max(0, x),
  leakyRelu: (x) => x >= 0 ? x : 0.1 * x,
  gelu: (x) => {
    // Approximation of GELU
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))))
  }
}

export default function ActivationGraph({ type, yRange = [-0.5, 1.5] }) {
  const fn = activationFunctions[type]
  
  if (!fn) {
    return <div className="text-red-500">Unknown activation: {type}</div>
  }

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-gray-200">
      <Mafs
        height={250}
        viewBox={{ x: [-5, 5], y: yRange }}
      >
        <Coordinates.Cartesian />
        <Plot.OfX y={fn} color={Theme.blue} />
      </Mafs>
    </div>
  )
}
