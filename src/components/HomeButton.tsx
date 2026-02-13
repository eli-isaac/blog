import { Link } from 'react-router-dom'

export default function HomeButton() {
  return (
    <Link 
      to="/posts" 
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900"
      aria-label="Home"
    >
      <img src="/arrowsmith.png" alt="" className="w-6 h-6" />
      <span className="hidden md:inline text-sm font-medium">Arrowsmith</span>
    </Link>
  )
}
