import { NeuralNetworkProvider } from './context'
import Controls from './Controls'
import ProblemSelector from './ProblemSelector'
import Canvas from './Canvas'
import TrainingLoop from './TrainingLoop'

export default function NeuralNetworkDemo() {
  return (
    <NeuralNetworkProvider>
      <div className="my-8 p-6 border border-gray-300 rounded-lg">
        <p className="text-sm text-gray-500 mb-4">
          Hit <strong>Train</strong> to start training the network. Try each problem with "No activation" first, then switch to an activation function and train again to see the difference.
        </p>
        <Controls />
        <ProblemSelector>
          <Canvas />
        </ProblemSelector>
        <TrainingLoop />
      </div>
    </NeuralNetworkProvider>
  )
}
