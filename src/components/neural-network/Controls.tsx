import { useNeuralNetwork } from './context'
import Settings from './Settings'
import type { ActivationType } from './network'

export default function Controls() {
  const { 
    isTraining, 
    setIsTraining, 
    reset, 
    state, 
    activation, 
    setActivation,
  } = useNeuralNetwork()

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between mb-4 pb-4 border-b border-gray-200">
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setIsTraining(!isTraining)}
          className={`px-4 py-2 rounded text-sm font-medium cursor-pointer ${
            isTraining 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isTraining ? 'Pause' : 'Train'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm cursor-pointer"
        >
          Reset
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={activation}
          onChange={(e) => setActivation(e.target.value as ActivationType)}
          className="px-4 py-2.5 border border-gray-300 rounded-md text-sm bg-transparent cursor-pointer appearance-none pr-8 hover:border-gray-400 transition-colors"
          title="Choose activation function"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
        >
          <option value="none">No activation (linear)</option>
          <option value="relu">ReLU</option>
          <option value="sigmoid">Sigmoid</option>
          <option value="tanh">Tanh</option>
        </select>
        
        <Settings />
      </div>
      
      <div className="text-sm font-mono">
        <span className="text-gray-500">Epoch:</span> {state.epoch}
        <span className="mx-3 text-gray-300">|</span>
        <span className="text-gray-500">Loss:</span> {state.loss.toFixed(4)}
      </div>
    </div>
  )
}
