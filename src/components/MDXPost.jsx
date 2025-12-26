import PostPage from './PostPage'
import ActivationGraph from './ActivationGraph'
import NeuralNetworkDemo from './NeuralNetworkDemo'

// Custom components available in all MDX files
const components = {
  // Override default HTML elements with styled versions
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mt-12 mb-4">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
  ),
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
