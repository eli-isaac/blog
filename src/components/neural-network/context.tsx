import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { problems, Problem } from './problems'
import { createNetwork, trainStep, Network, DataPoint, ActivationType } from './network'

interface ProblemState {
  network: Network
  epoch: number
  loss: number
  data: DataPoint[]
}

interface NeuralNetworkContextType {
  currentProblem: Problem
  currentProblemIndex: number
  problemCount: number
  state: ProblemState
  activation: ActivationType
  setActivation: (activation: ActivationType) => void
  isTraining: boolean
  setIsTraining: (isTraining: boolean) => void
  nextProblem: () => void
  prevProblem: () => void
  reset: () => void
  train: () => void
  tick: number
  hiddenSize: number
  setHiddenSize: (size: number) => void
}

const NeuralNetworkContext = createContext<NeuralNetworkContextType | null>(null)

function createInitialState(problem: Problem, hiddenSize: number): ProblemState {
  return {
    network: createNetwork(hiddenSize, problem.inputSize, problem.outputSize),
    epoch: 0,
    loss: 1,
    data: problem.generateData(),
  }
}

function createInitialStates(hiddenSizes: number[]): ProblemState[] {
  return problems.map((p, i) => createInitialState(p, hiddenSizes[i]))
}

interface NeuralNetworkProviderProps {
  children: ReactNode
}

export function NeuralNetworkProvider({ children }: NeuralNetworkProviderProps) {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [activation, setActivation] = useState<ActivationType>('relu')
  const [isTraining, setIsTraining] = useState(false)
  const [tick, setTick] = useState(0)
  
  // Hidden sizes per problem
  const [hiddenSizes, setHiddenSizes] = useState(() => 
    problems.map(p => p.hiddenSize)
  )
  
  const problemStates = useRef(createInitialStates(hiddenSizes))

  const currentProblem = problems[currentProblemIndex]
  const currentState = problemStates.current[currentProblemIndex]
  const hiddenSize = hiddenSizes[currentProblemIndex]

  // Reset when activation changes
  const handleActivationChange = useCallback((newActivation: ActivationType) => {
    setActivation(newActivation)
    setIsTraining(false)
    // Reset current problem
    problemStates.current[currentProblemIndex] = createInitialState(
      problems[currentProblemIndex], 
      hiddenSizes[currentProblemIndex]
    )
    setTick(t => t + 1)
  }, [currentProblemIndex, hiddenSizes])

  const setHiddenSize = useCallback((size: number) => {
    setHiddenSizes(prev => {
      const next = [...prev]
      next[currentProblemIndex] = size
      return next
    })
    setIsTraining(false)
    // Reset with new hidden size
    problemStates.current[currentProblemIndex] = createInitialState(
      problems[currentProblemIndex], 
      size
    )
    setTick(t => t + 1)
  }, [currentProblemIndex])

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
    problemStates.current[currentProblemIndex] = createInitialState(
      problems[currentProblemIndex], 
      hiddenSizes[currentProblemIndex]
    )
    setTick(t => t + 1)
  }, [currentProblemIndex, hiddenSizes])

  const train = useCallback(() => {
    const state = problemStates.current[currentProblemIndex]
    const loss = trainStep(state.network, state.data, activation)
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
      setActivation: handleActivationChange,
      isTraining,
      setIsTraining,
      nextProblem,
      prevProblem,
      reset,
      train,
      tick,
      hiddenSize,
      setHiddenSize,
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
