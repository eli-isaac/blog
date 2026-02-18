import { Children, isValidElement, ReactNode, ComponentType } from 'react'
import type { MDXComponents } from 'mdx/types'
import PostPage from './PostPage'
import ActivationGraph from './ActivationGraph'
import NeuralNetworkDemo from './NeuralNetworkDemo'
import useDocumentMeta from '../hooks/useDocumentMeta'
import { postText } from '../config/posts'

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
    <h2 className={`text-xl 2xl:text-2xl font-bold mt-12 mb-4 ${postText.heading}`}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className={`text-lg 2xl:text-xl font-semibold mt-8 mb-3 ${postText.heading}`}>{children}</h3>
  ),
  p: ({ children }) => {
    if (isBlockMath(children)) {
      return <p className="text-center my-6">{children}</p>
    }
    return <p className={`${postText.body} text-base 2xl:text-lg leading-[1.8] 2xl:leading-[1.85] mb-4`}>{children}</p>
  },
  ul: ({ children }) => (
    <ul className={`list-disc pl-6 ${postText.body} text-base 2xl:text-lg leading-[1.8] 2xl:leading-[1.85] mb-4 space-y-3`}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className={`list-decimal pl-6 ${postText.body} text-base 2xl:text-lg leading-[1.8] 2xl:leading-[1.85] mb-4 space-y-3`}>{children}</ol>
  ),
  li: ({ children }) => (
    <li className="[&>ul]:!mb-4 [&>ul]:mt-2 [&>ul]:pl-6 [&>ul]:space-y-2 [&>ol]:!mb-4 [&>ol]:mt-2 [&>ol]:pl-6 [&>ol]:space-y-2 [&>p:last-child]:!mb-0">{children}</li>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target={href?.startsWith('#') ? undefined : '_blank'}
      rel={href?.startsWith('#') ? undefined : 'noopener noreferrer'}
      className={`${postText.body} underline decoration-gray-400 hover:decoration-gray-700 transition-colors`}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className={`border-l-4 border-gray-400 pl-4 my-6 ${postText.muted} italic`}>
      {children}
    </blockquote>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img src={src} alt={alt || ''} loading="lazy" className="w-full rounded-lg my-6" />
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm text-left border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="border-b-2 border-gray-300">{children}</thead>
  ),
  tbody: ({ children }: { children?: ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: ReactNode }) => (
    <tr className="border-b border-gray-200">{children}</tr>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className={`py-2 pr-4 font-semibold ${postText.tableHeader}`}>{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className={`py-2 pr-4 ${postText.body}`}>{children}</td>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="bg-gray-800 text-gray-100 rounded-lg p-4 my-6 overflow-x-auto text-sm leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ children, className }: { children?: ReactNode; className?: string }) => {
    // If className exists, it's a code block (inside <pre>) — render as-is
    if (className) {
      return <code className={className}>{children}</code>
    }
    // Otherwise it's inline code
    return (
      <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    )
  },

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
    canonicalPath: `/posts/${meta.slug}`,
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
