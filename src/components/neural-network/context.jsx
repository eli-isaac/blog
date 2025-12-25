import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { problems } from './problems'
import { createNetwork, trainStep } from './network'

const NeuralNetworkContext = createContext()

function createInitialStates() {
  return problems.map(p => ({
    network: createNetwork(p.hiddenSize, p.inputSize, p.outputSize),
    epoch: 0,
    loss: 1,
    data: p.generateData(),
  }))
}

export function NeuralNetworkProvider({ children }) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [activation, setActivation] = useState('relu')
  const [isTraining, setIsTraining] = useState(false)
  const [tick, setTick] = useState(0) // Force re-renders
  
  const problemStates = useRef(createInitialStates())

  const currentProblem = problems[currentProblemIndex]
  const currentState = problemStates.current[currentProblemIndex]

  const nextProblem = useCallback(() => {
    setIsTraining(false)
    setCurrentProblemIndex(i => (i + 1) % problems.length)
  }, [])

  const prevProblem = useCallback(() => {
    setIsTraining(false)
    setCurrentProblemIndex(i => (i - 1 + problems.length) % problems.length)
  }, [])

  const reset = useCallback(() => {
    setIsTraining(false)
    const p = problems[currentProblemIndex]
    problemStates.current[currentProblemIndex] = {
      network: createNetwork(p.hiddenSize, p.inputSize, p.outputSize),
      epoch: 0,
      loss: 1,
      data: p.generateData(),
    }
    setTick(t => t + 1)
  }, [currentProblemIndex])

  const train = useCallback(() => {
    const state = problemStates.current[currentProblemIndex]
    const problem = problems[currentProblemIndex]
    const loss = trainStep(state.network, state.data, activation, problem.outputSize)
    state.epoch += 1
    state.loss = loss
    setTick(t => t + 1)
  }, [currentProblemIndex, activation])

  return (
    <NeuralNetworkContext.Provider value={{
      currentProblem,
      currentProblemIndex,
      problemCount: problems.length,
      state: currentState,
      activation,
      setActivation,
      isTraining,
      setIsTraining,
      nextProblem,
      prevProblem,
      reset,
      train,
      tick,
    }}>
      {children}
    </NeuralNetworkContext.Provider>
  )
}

export function useNeuralNetwork() {
  const context = useContext(NeuralNetworkContext)
  if (!context) throw new Error('useNeuralNetwork must be used within NeuralNetworkProvider')
  return context
}
