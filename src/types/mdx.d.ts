declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { MDXComponents } from 'mdx/types'
  
  interface PostMeta {
    title: string
    subtitle?: string
    date: string
    authors?: string[]
    slug: string
  }
  
  export const meta: PostMeta
  
  const MDXComponent: ComponentType<{ components?: MDXComponents }>
  export default MDXComponent
}
