import { useNeuralNetwork } from './context'

function Arrow({ direction, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
      aria-label={direction === 'left' ? 'Previous problem' : 'Next problem'}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  )
}

export default function ProblemSelector({ children }) {
  const { currentProblem, nextProblem, prevProblem, currentProblemIndex, problemCount } = useNeuralNetwork()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Arrow direction="left" onClick={prevProblem} />
        
        <div className="text-center">
          <h3 className="font-semibold">{currentProblem.name}</h3>
          <p className="text-xs text-gray-500">{currentProblem.description}</p>
          <div className="flex justify-center gap-1 mt-2">
            {Array(problemCount).fill(0).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ${i === currentProblemIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
        
        <Arrow direction="right" onClick={nextProblem} />
      </div>
      
      {children}
    </div>
  )
}

