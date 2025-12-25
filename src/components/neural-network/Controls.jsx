import { useNeuralNetwork } from './context'

export default function Controls() {
  const { 
    isTraining, 
    setIsTraining, 
    reset, 
    state, 
    activation, 
    setActivation,
    currentProblemIndex,
  } = useNeuralNetwork()

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between mb-4 pb-4 border-b border-gray-200">
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setIsTraining(!isTraining)}
          className={`px-4 py-2 rounded text-sm font-medium ${
            isTraining 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isTraining ? 'Pause' : 'Train'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Reset
        </button>
      </div>
      
      <select
        value={activation}
        onChange={(e) => setActivation(e.target.value)}
        className="px-3 py-2 border rounded text-sm bg-white"
      >
        <option value="none">No activation (linear)</option>
        <option value="relu">ReLU</option>
        <option value="sigmoid">Sigmoid</option>
        <option value="tanh">Tanh</option>
      </select>
      
      <div className="text-sm font-mono">
        <span className="text-gray-500">Epoch:</span> {state.epoch}
        <span className="mx-3 text-gray-300">|</span>
        <span className="text-gray-500">Loss:</span> {state.loss.toFixed(4)}
      </div>
    </div>
  )
}

