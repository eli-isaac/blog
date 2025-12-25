import { Link } from 'react-router-dom'

export default function HomeButton() {
  return (
    <Link 
      to="/posts" 
      className="fixed bottom-6 left-6 z-50 p-2 text-gray-600 hover:text-gray-900"
      aria-label="Home"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/>
      </svg>
    </Link>
  )
}

