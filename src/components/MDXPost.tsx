import { Children, isValidElement, ReactNode, ComponentType } from 'react'
import type { MDXComponents } from 'mdx/types'
import PostPage from './PostPage'
import ActivationGraph from './ActivationGraph'
import NeuralNetworkDemo from './NeuralNetworkDemo'
import useDocumentMeta from '../hooks/useDocumentMeta'

export interface PostMeta {
  title: string
  subtitle?: string
  date: string
  authors?: string[]
  slug: string
  description?: string
}

// Check if paragraph contains only math (for centering block equations)
function isBlockMath(children: ReactNode): boolean {
  const childArray = Children.toArray(children)
  // Block math: single child that's a span with katex class
  if (childArray.length === 1 && isValidElement(childArray[0])) {
    const child = childArray[0]
    // Check if it's a span (katex wraps in span)
    if (child.type === 'span' && (child.props as { className?: string })?.className?.includes('katex')) {
      return true
    }
  }
  return false
}

// Custom components available in all MDX files
export const mdxComponents: MDXComponents = {
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
  
  // Citation component with link
  Cite: ({ authors, year, url }: { authors: string; year: string; url: string }) => (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-gray-500 hover:text-gray-700 hover:underline"
    >
      ({authors}, {year})
    </a>
  ),
}

interface MDXPostProps {
  meta: PostMeta
  Content: ComponentType<{ components?: MDXComponents }>
}

export default function MDXPost({ meta, Content }: MDXPostProps) {
  const description = meta.description || meta.subtitle || meta.title
  const authorStr = meta.authors?.join(', ') || ''

  useDocumentMeta({
    title: meta.title,
    description: `${description}${authorStr ? ` — by ${authorStr}` : ''}`,
    ogType: 'article',
    keywords: meta.title.toLowerCase().split(/\s+/).join(', '),
  })

  return (
    <PostPage
      title={meta.title}
      subtitle={meta.subtitle}
      date={meta.date}
      authors={meta.authors}
      slug={meta.slug}
    >
      <Content components={mdxComponents} />
    </PostPage>
  )
}
