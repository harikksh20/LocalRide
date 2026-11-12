
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { registerDriver } from '../services/driverApi'

type Vehicle = 'Auto' | 'Car' | 'Pickup' | 'Lorry'

type DriverForm = {
  name: string
  phone: string
  vehicle: Vehicle
  area: string
  fare: string
  password: string
  confirmPassword: string
}

const initialForm: DriverForm = {
  name: '',
  phone: '',
  vehicle: 'Auto',
  area: '',
  fare: '',
  password: '',
  confirmPassword: '',
}

export default function DriverRegistrationPage() {
  const navigate = useNavigate()
  

  const [form, setForm] = useState<DriverForm>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setMessage('')
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

    const name = form.name.trim()
    const phone = form.phone.trim()
    const area = form.area.trim()
    const fare = Number(form.fare)

    if (name.length < 2) {
      setError('Please enter your full name.')
      return
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    if (area.length < 2) {
      setError('Please enter a valid service area.')
      return
    }

    if (!Number.isFinite(fare) || fare <= 0 || !Number.isInteger(fare)) {
      setError('Enter a valid whole-number fare greater than zero.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const newDriver = await registerDriver({
        name,
        phone,
        vehicle: form.vehicle,
        area,
        fare,
        password: form.password,
      })

      // Keep the existing context in sync with the API response.
      

      setMessage(
        `Registration completed successfully! Welcome to LocalRide, ${newDriver.name}.`,
      )
      setForm(initialForm)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not register. Please try again.',
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
          <Link to="/driver/dashboard">Driver Dashboard</Link>
        </nav>
      </header>

      <main className="registration-page">
        <div className="registration-heading">
          <span className="section-kicker">JOIN LOCALRIDE</span>
          <h1>Become a driver</h1>
          <p>
            Connect with customers in your area and grow your
            local transport service.
          </p>
        </div>

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="registration-form-heading">
            <h2>Driver registration</h2>
            <p>Fill in your details to get started.</p>
          </div>

          <label className="registration-field">
            Full name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              minLength={2}
              required
            />
          </label>

          <label className="registration-field">
            Mobile number
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              autoComplete="tel-national"
              inputMode="numeric"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              title="Enter a valid 10-digit Indian mobile number"
              required
            />
          </label>

          <label className="registration-field">
            Vehicle type
            <select
              name="vehicle"
              value={form.vehicle}
              onChange={handleChange}
              required
            >
              <option value="Auto">Auto</option>
              <option value="Car">Car</option>
              <option value="Pickup">Pickup</option>
              <option value="Lorry">Lorry</option>
            </select>
          </label>

          <label className="registration-field">
            Service area
            <input
              type="text"
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="e.g. Rasipuram"
              autoComplete="address-level2"
              minLength={2}
              required
            />
          </label>

          <label className="registration-field">
            Starting fare (₹)
            <input
              type="number"
              name="fare"
              value={form.fare}
              onChange={handleChange}
              placeholder="e.g. 200"
              min="1"
              step="1"
              required
            />
          </label>

          <label className="registration-field">
            Password
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="registration-field">
            Confirm password
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Enter your password again"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="registration-field">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            Show passwords
          </label>

          {error && (
            <p
              className="registration-message registration-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {message && (
            <div className="registration-success" role="status">
              <strong>✓ Registration successful!</strong>
              <p>{message}</p>
              <p>Your driver details have been saved to the LocalRide database.</p>
              <Link to="/driver/dashboard">
                Open Driver Dashboard →
              </Link>
            </div>
          )}

          <button
            className="btn btn-primary registration-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Create driver account →'}
          </button>

          <p className="registration-note">
            Your password is securely hashed by the backend before it is stored.
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
