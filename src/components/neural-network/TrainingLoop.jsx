import { useEffect, useRef } from 'react'
import { useNeuralNetwork } from './context'

export default function TrainingLoop() {
  const { isTraining, train } = useNeuralNetwork()
  const animationRef = useRef(null)
  const lastTrainRef = useRef(0)

  useEffect(() => {
    if (isTraining) {
      const step = (timestamp) => {
        // Throttle to ~30 fps for smoother visuals
        if (timestamp - lastTrainRef.current > 33) {
          train()
          lastTrainRef.current = timestamp
        }
        animationRef.current = requestAnimationFrame(step)
      }
      animationRef.current = requestAnimationFrame(step)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isTraining, train])

  return null
}

