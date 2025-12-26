import { Children, isValidElement } from 'react'
import PostPage from './PostPage'
import ActivationGraph from './ActivationGraph'
import NeuralNetworkDemo from './NeuralNetworkDemo'

// Check if paragraph contains only math (for centering block equations)
function isBlockMath(children) {
  const childArray = Children.toArray(children)
  // Block math: single child that's a span with katex class
  if (childArray.length === 1 && isValidElement(childArray[0])) {
    const child = childArray[0]
    // Check if it's a span (katex wraps in span)
    if (child.type === 'span' && child.props?.className?.includes('katex')) {
      return true
    }
  }
  return false
}

// Custom components available in all MDX files
const components = {
  // Override default HTML elements with styled versions
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mt-12 mb-4">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }) => {
    // Center paragraphs that contain only block math
    if (isBlockMath(children)) {
      return <p className="text-center my-6">{children}</p>
    }
    return <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
  },
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  
  // Custom components for interactive elements
  ActivationGraph,
  NeuralNetworkDemo,
  
  // Reference component for citations
  Reference: ({ children }) => (
    <span className="text-gray-500">({children})</span>
  ),
}

export default function MDXPost({ meta, Content }) {
  return (
    <PostPage
      title={meta.title}
      subtitle={meta.subtitle}
      date={meta.date}
      authors={meta.authors}
      slug={meta.slug}
    >
      <Content components={components} />
    </PostPage>
  )
}
