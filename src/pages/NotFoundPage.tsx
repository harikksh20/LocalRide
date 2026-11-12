import { Link } from 'react-router-dom'
import '../App.css'

export default function NotFoundPage() {
  return (
    <main className="empty-state">
      <span>🚧</span>
      <h3>Page not found</h3>
      <p>The page you are looking for does not exist.</p>
      <Link className="btn btn-primary" to="/">
        Back to Home
      </Link>
    </main>
  )
}