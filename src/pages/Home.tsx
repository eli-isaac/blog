import HomeBackground, { PortalConfig } from '../components/HomeBackground'
import useDocumentMeta from '../hooks/useDocumentMeta'

// Define portal nodes - add more here for additional pages
const portals: PortalConfig[] = [
  {
    id: 'posts',
    path: '/posts',
    color: '160, 80, 80', // Muted red
    radius: 8,
    label: 'Blog Posts',
  },
  {
    id: 'about',
    path: '/about',
    color: '80, 110, 90', // Muted green
    radius: 8,
    label: 'About',
  },
]

export default function Home() {
  useDocumentMeta({
    title: 'Arrowsmith',
    description: 'Explanatory articles and novel ideas on machine learning, optimization, and philosophy.',
  })

  return <HomeBackground portals={portals} />
}
