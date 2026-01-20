import HomeBackground, { PortalConfig } from '../components/HomeBackground'

// Define portal nodes - add more here for additional pages
const portals: PortalConfig[] = [
  {
    id: 'posts',
    path: '/posts',
    color: '200, 70, 70', // Muted red
    radius: 8,
    label: 'Blog Posts',
  },
  {
    id: 'projects',
    path: '/projects',
    color: '50, 120, 80', // Dark green
    radius: 8,
    label: 'Projects',
  },
]

export default function Home() {
  return <HomeBackground portals={portals} />
}
