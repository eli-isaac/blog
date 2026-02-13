import { NeuralNetworkProvider } from './context'
import Controls from './Controls'
import ProblemSelector from './ProblemSelector'
import Canvas from './Canvas'
import TrainingLoop from './TrainingLoop'

export default function NeuralNetworkDemo() {
  return (
    <NeuralNetworkProvider>
      <div className="my-8 p-6 border border-gray-300 rounded-lg">
        <Controls />
        <ProblemSelector>
          <Canvas />
        </ProblemSelector>
        <TrainingLoop />
      </div>
    </NeuralNetworkProvider>
  )
}
