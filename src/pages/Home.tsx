import HomeBackground, { PortalConfig } from '../components/HomeBackground'

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
    id: 'projects',
    path: '/projects',
    color: '80, 110, 90', // Muted green
    radius: 8,
    label: 'Projects',
  },
]

export default function Home() {
  return <HomeBackground portals={portals} />
}
