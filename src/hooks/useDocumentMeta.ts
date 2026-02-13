import { useEffect } from 'react'

interface DocumentMeta {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogType?: string
  keywords?: string
}

/**
 * Sets document title and meta tags for SEO.
 * Restores defaults on unmount.
 */
export default function useDocumentMeta({ title, description, ogTitle, ogDescription, ogType, keywords }: DocumentMeta) {
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

    if (description) setMeta('description', description)
    if (keywords) setMeta('keywords', keywords)
    if (ogTitle || title) setMeta('og:title', ogTitle || `${title} — Arrowsmith`, 'property')
    if (ogDescription || description) setMeta('og:description', (ogDescription || description)!, 'property')
    if (ogType) setMeta('og:type', ogType, 'property')

    // Twitter card mirrors OG
    if (ogTitle || title) setMeta('twitter:title', ogTitle || `${title} — Arrowsmith`)
    if (ogDescription || description) setMeta('twitter:description', (ogDescription || description)!)

    return () => {
      document.title = prevTitle
      // Reset to defaults
      setMeta('description', 'Arrowsmith — Explanatory articles and novel ideas on machine learning, optimization, and philosophy.')
      setMeta('og:title', 'Arrowsmith', 'property')
      setMeta('og:description', 'Explanatory articles and novel ideas on machine learning, optimization, and philosophy.', 'property')
      setMeta('og:type', 'website', 'property')
      setMeta('twitter:title', 'Arrowsmith')
      setMeta('twitter:description', 'Explanatory articles and novel ideas on machine learning, optimization, and philosophy.')
    }
  }, [title, description, ogTitle, ogDescription, ogType, keywords])
}
