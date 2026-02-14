import { ComponentType } from 'react'

// Import MDX posts
import DropLossContent, { meta as dropLossMeta } from './drop-loss.mdx'
import ActivationFunctionsContent, { meta as activationFunctionsMeta } from './activation-functions.mdx'

export interface PostMeta {
  title: string
  subtitle?: string
  date: string
  authors?: string[]
  slug: string
  description?: string
}

export interface Post {
  meta: PostMeta
  Content: ComponentType
}

// Single source of truth for all posts
export const posts: Post[] = [
  {
    meta: dropLossMeta,
    Content: DropLossContent,
  },
  {
    meta: activationFunctionsMeta,
    Content: ActivationFunctionsContent,
  },
]
