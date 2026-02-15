import { useEffect } from 'react'

const SITE_URL = 'https://arrowsmith.ai'
const DEFAULT_DESC = 'Posts on machine learning, code optimization, and philosophy.'

interface DocumentMeta {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogType?: string
  /** Canonical path, e.g. '/posts/drop-loss'. Defaults to current pathname. */
  canonicalPath?: string
}

/**
 * Sets document title, meta tags, canonical URL, and OG tags for SEO.
 * Restores defaults on unmount.
 */
export default function useDocumentMeta({ title, description, ogTitle, ogDescription, ogType, canonicalPath }: DocumentMeta) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${title} — Arrowsmith`

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    const setCanonical = (href: string) => {
      let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', 'canonical')
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
    }

    const resolvedPath = canonicalPath ?? window.location.pathname
    const canonicalUrl = `${SITE_URL}${resolvedPath === '/' ? '' : resolvedPath}`

    if (description) setMeta('description', description)
    setMeta('og:title', ogTitle || `${title} — Arrowsmith`, 'property')
    if (ogDescription || description) setMeta('og:description', (ogDescription || description)!, 'property')
    if (ogType) setMeta('og:type', ogType, 'property')
    setMeta('og:url', canonicalUrl, 'property')
    setCanonical(canonicalUrl)

    // Twitter card mirrors OG
    setMeta('twitter:title', ogTitle || `${title} — Arrowsmith`)
    if (ogDescription || description) setMeta('twitter:description', (ogDescription || description)!)

    return () => {
      document.title = prevTitle
      setMeta('description', DEFAULT_DESC)
      setMeta('og:title', 'Arrowsmith', 'property')
      setMeta('og:description', DEFAULT_DESC, 'property')
      setMeta('og:type', 'website', 'property')
      setMeta('og:url', SITE_URL, 'property')
      setCanonical(SITE_URL)
      setMeta('twitter:title', 'Arrowsmith')
      setMeta('twitter:description', DEFAULT_DESC)
    }
  }, [title, description, ogTitle, ogDescription, ogType, canonicalPath])
}
