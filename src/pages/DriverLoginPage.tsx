
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { loginDriver } from '../services/driverApi'

export default function DriverLoginPage() {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const result = await loginDriver(phone.trim(), password)

      // Store the session token and the authenticated driver's public details.
      sessionStorage.setItem('localride-driver-token', result.token)
      sessionStorage.setItem(
        'localride-authenticated-driver',
        JSON.stringify(result.driver),
      )

      navigate('/driver/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <Link className="brand" to="/">
          <span className="brand-icon">L</span>
          <span>
            local<span className="brand-accent">ride</span>
          </span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/drivers">Find Drivers</Link>
          <Link to="/driver/register">Become a Driver</Link>
        </nav>
      </header>

      <main className="registration-page">
        <div className="registration-heading">
          <span className="section-kicker">WELCOME BACK</span>
          <h1>Driver login</h1>
          <p>
            Log in to access your LocalRide driver account.
          </p>
        </div>

        <form
          className="registration-form"
          onSubmit={handleSubmit}
        >
          <div className="registration-form-heading">
            <h2>Sign in to LocalRide</h2>
            <p>Enter your registered mobile number and password.</p>
          </div>

          <label className="registration-field">
            Mobile number
            <input
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                setError('')
              }}
              placeholder="10-digit mobile number"
              autoComplete="tel-national"
              inputMode="numeric"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              required
            />
          </label>

          <label className="registration-field">
            Password
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <label className="registration-field">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) =>
                setShowPassword(event.target.checked)
              }
            />
            Show password
          </label>

          {error && (
            <p
              className="registration-message registration-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="btn btn-primary registration-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Login →'}
          </button>

          <p className="registration-note">
            New to LocalRide?{' '}
            <Link to="/driver/register">
              Create a driver account
            </Link>
          </p>

          <button
            className="registration-back"
            type="button"
            onClick={() => navigate('/')}
          >
            ← Back to home
          </button>
        </form>
      </main>

      <footer className="footer">
        <p>Connecting local drivers with everyday journeys.</p>
      </footer>
    </div>
  )
}
