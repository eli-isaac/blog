import { useState } from 'react'
import { useNeuralNetwork } from './context'

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentProblem, hiddenSize, setHiddenSize } = useNeuralNetwork()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
        aria-label="Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
            <h4 className="font-semibold text-sm mb-3">Network Architecture</h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Input neurons:</span>
                <span className="font-mono">{currentProblem.inputSize}</span>
              </div>
              
              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Hidden neurons:</span>
                  <span className="font-mono">{hiddenSize}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="32"
                  step="4"
                  value={hiddenSize}
                  onChange={(e) => setHiddenSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>4</span>
                  <span>32</span>
                </div>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Output neurons:</span>
                <span className="font-mono">{currentProblem.outputSize}</span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Total parameters:</span>
                  <span className="font-mono">
                    {currentProblem.inputSize * hiddenSize + hiddenSize + hiddenSize * currentProblem.outputSize + currentProblem.outputSize}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

