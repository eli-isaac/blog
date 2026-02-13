import { ComponentType } from 'react'

// Import MDX posts
import ActivationFunctionsContent, { meta as activationFunctionsMeta } from './activation-functions.mdx'
import PlaceholderJourneyContent, { meta as placeholderJourneyMeta } from './placeholder-journey.mdx'
import PlaceholderIdeasContent, { meta as placeholderIdeasMeta } from './placeholder-ideas.mdx'

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
    meta: activationFunctionsMeta,
    Content: ActivationFunctionsContent,
  },
  {
    meta: placeholderJourneyMeta,
    Content: PlaceholderJourneyContent,
  },
  {
    meta: placeholderIdeasMeta,
    Content: PlaceholderIdeasContent,
  },
]
