import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

export function Inline({ children }) {
  return <InlineMath math={children} />
}

export function Block({ children }) {
  return (
    <div className="my-6 overflow-x-auto">
      <BlockMath math={children} />
    </div>
  )
}
