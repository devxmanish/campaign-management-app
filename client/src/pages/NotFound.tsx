import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Button from '../components/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Page not found</h2>
        <p className="text-gray-600 mt-2 max-w-md">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
