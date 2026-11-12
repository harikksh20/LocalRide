
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import '../App.css'
import type { Driver, VehicleType } from '../data/mockDrivers'
import { useDriverContext } from '../context/DriverContext'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import DriverCard from '../components/drivers/DriverCard'
import DriverFilters from '../components/drivers/DriverFilters'
import VehicleCategories from '../components/drivers/VehicleCategories'

function toRouteId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return 1_000_000 + (hash % 1_000_000_000)
}

export default function HomePage() {
  const [area, setArea] = useState('')
  const [searchArea, setSearchArea] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [vehicle, setVehicle] = useState<VehicleType>('All')
  const [availableOnly, setAvailableOnly] = useState(true)
  const [notice, setNotice] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const navigate = useNavigate()
  const { signOutCustomer, user } = useCustomerAuth()

  const {
    drivers: registeredDrivers,
    loading,
    error,
    refreshDrivers,
  } = useDriverContext()

  const drivers = useMemo<Driver[]>(() => {
    return registeredDrivers.map((registered) => ({
      id: toRouteId(registered.id),
      name: registered.name,
      vehicle: registered.vehicle,
      area: registered.area,
      fare: registered.fare,
      rating: 5,
      available: true,
      trips: 0,
    }))
  }, [registeredDrivers])

  const filteredDrivers = useMemo(() => {
    if (!hasSearched || !searchArea.trim()) return []

    return drivers.filter((driver) => {
      const matchesArea = driver.area
        .toLowerCase()
        .includes(searchArea.trim().toLowerCase())
      const matchesVehicle = vehicle === 'All' || driver.vehicle === vehicle
      const matchesAvailability = !availableOnly || driver.available

      return matchesArea && matchesVehicle && matchesAvailability
    })
  }, [drivers, searchArea, vehicle, availableOnly, hasSearched])

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await signOutCustomer()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Customer logout failed:', error)
      setNotice('Could not log out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  function handleSearch() {
    setSearchArea(area.trim())
    setHasSearched(true)
    setNotice('')

    window.setTimeout(() => {
      document.getElementById('drivers')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 80)
  }

  function handleBooking(driver: Driver) {
    if (!driver.available) {
      setNotice('This driver is currently unavailable.')
      return
    }

    navigate(`/driver/${driver.id}`)
  }

  function resetSearch() {
    setArea('')
    setSearchArea('')
    setHasSearched(false)
    setVehicle('All')
    setAvailableOnly(true)
    setNotice('')
  }

  return (
    <div className="app luxury-home">
      <header className="navbar">
        <Link className="brand" to="/customer/dashboard" aria-label="LocalRide home">
          <span className="brand-icon">L</span>
          <span>local<span className="brand-accent">ride</span></span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link className="nav-active" to="/customer/dashboard">Home</Link>
          <Link to="/drivers">Find Drivers</Link>
          <a href="#how-it-works">How it works</a>
          <Link to="/my-bookings">My Bookings</Link>
        </nav>

        <div className="nav-actions">
          <span className="customer-welcome">
            {user?.displayName || user?.email || 'Customer'}
          </span>

          <Link className="btn btn-outline" to="/driver/register">
            Become a driver
          </Link>

          <button
            className="btn btn-dark"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out…' : 'Logout'}
            <span aria-hidden="true"> ↗</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero luxury-hero" id="home">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />

          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          >
            <div className="eyebrow">
              <span className="live-dot" />
              YOUR JOURNEY, ROOTED IN LOCAL
            </div>

            <h1>
              Local journeys.
              <br />
              <span>Elevated.</span>
            </h1>

            <p className="hero-description">
              Discover trusted local transport for everyday rides and
              goods movement. Find the right driver, choose your vehicle,
              and make your next journey simpler.
            </p>

            <div className="hero-cta-row">
              <a className="btn btn-primary hero-cta" href="#find-your-ride">
                Find your ride <span aria-hidden="true">↗</span>
              </a>
              <Link className="hero-text-link" to="/driver/register">
                Drive with LocalRide <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="hero-highlights">
              <span><i>01</i> Local drivers</span>
              <span><i>02</i> Multiple vehicles</span>
              <span><i>03</i> Simple booking</span>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            aria-label="Local transport vehicles"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
          >
            <div className="visual-label">
              <span className="live-dot" />
              MADE FOR YOUR COMMUNITY
            </div>
            <div className="visual-glow" />
            <div className="vehicle-illustration">
              <span className="vehicle-large" aria-hidden="true">🚚</span>
              <span className="vehicle-small vehicle-car" aria-hidden="true">🚗</span>
              <span className="vehicle-small vehicle-auto" aria-hidden="true">🛺</span>
            </div>
            <div className="floating-card">
              <span className="floating-icon" aria-hidden="true">⌖</span>
              <div>
                <strong>Closer to what matters</strong>
                <p>Local transport, made easier</p>
              </div>
            </div>
            <div className="hero-visual-index">LR / 001</div>
          </motion.div>

          <div className="hero-bottom-note">
            <span>LOCAL KNOWLEDGE</span>
            <span className="hero-note-line" />
            <span>EVERYDAY MOBILITY</span>
          </div>
        </section>

        <section
          className="search-section luxury-search"
          id="find-your-ride"
          aria-label="Search drivers"
        >
          <div className="search-heading">
            <div>
              <span className="section-kicker">THE JOURNEY STARTS HERE</span>
              <h2>Where do you need to go?</h2>
            </div>
            <span className="search-caption">A better way to move locally.</span>
          </div>

          <form
            className="search-bar"
            onSubmit={(event) => {
              event.preventDefault()
              handleSearch()
            }}
          >
            <label className="search-field">
              <span className="field-icon" aria-hidden="true">⌖</span>
              <span className="field-content">
                <span className="field-label">YOUR AREA</span>
                <input
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  placeholder="e.g. Rasipuram"
                  aria-label="Search area"
                  required
                />
              </span>
            </label>

            <div className="search-divider" />

            <label className="search-field vehicle-search">
              <span className="field-icon" aria-hidden="true">↗</span>
              <span className="field-content">
                <span className="field-label">VEHICLE TYPE</span>
                <select
                  value={vehicle}
                  onChange={(event) => setVehicle(event.target.value as VehicleType)}
                  aria-label="Vehicle type"
                >
                  <option value="All">All vehicles</option>
                  <option value="Auto">Auto</option>
                  <option value="Car">Car</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Lorry">Lorry</option>
                </select>
              </span>
            </label>

            <button className="btn btn-primary search-button" type="submit" disabled={loading}>
              {loading ? 'Loading drivers…' : 'Explore drivers'} <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="search-hint">
            Search shows drivers registered with LocalRide in your selected area.
          </p>

          {error && (
            <div className="registration-message registration-error" role="alert">
              <p>Could not load registered drivers: {error}</p>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => void refreshDrivers().catch(() => undefined)}
                disabled={loading}
              >
                {loading ? 'Retrying…' : 'Retry connection'}
              </button>
            </div>
          )}
        </section>

        {hasSearched && (
          <motion.section
            className="drivers-section luxury-results"
            id="drivers"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="section-header">
              <div>
                <span className="section-kicker">YOUR LOCAL NETWORK</span>
                <h2>Drivers near {searchArea}</h2>
                <p className="section-description">
                  Choose a vehicle that suits your journey or delivery.
                </p>
              </div>

              <DriverFilters
                availableOnly={availableOnly}
                onAvailabilityChange={setAvailableOnly}
              />
            </div>

            <VehicleCategories
              selectedVehicle={vehicle}
              onVehicleChange={setVehicle}
            />

            <div className="results-heading">
              <h3>Available for your area</h3>
              <span className="results-count">
                {filteredDrivers.length} {filteredDrivers.length === 1 ? 'driver' : 'drivers'} found
              </span>
            </div>

            {loading ? (
              <p role="status">Loading registered drivers…</p>
            ) : filteredDrivers.length > 0 ? (
              <div className="driver-grid">
                {filteredDrivers.map((driver, index) => (
                  <motion.div
                    key={driver.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.055 }}
                  >
                    <DriverCard driver={driver} onBook={handleBooking} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">⌕</span>
                <h3>No registered drivers found</h3>
                <p>
                  Try another area or change the vehicle filter. Only
                  database-registered drivers can be booked.
                </p>
                <button className="btn btn-outline" onClick={resetSearch} type="button">
                  Reset search
                </button>
              </div>
            )}

            <p className="demo-note">
              Ratings, availability and trip counts are currently display defaults.
            </p>
          </motion.section>
        )}

        <section className="how-section luxury-how" id="how-it-works">
          <div className="how-intro">
            <span className="section-kicker">A MORE CONSIDERED JOURNEY</span>
            <h2>Three steps. Less friction.</h2>
            <p>From finding a local driver to requesting your ride, keep it simple.</p>
          </div>

          <div className="steps-grid">
            <motion.article className="step-card" whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <span className="step-number">01</span>
              <span className="step-icon" aria-hidden="true">⌖</span>
              <h3>Search your area</h3>
              <p>Enter your location and choose the type of vehicle you need.</p>
            </motion.article>

            <motion.article className="step-card" whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <span className="step-number">02</span>
              <span className="step-icon" aria-hidden="true">↗</span>
              <h3>Explore your options</h3>
              <p>Compare registered local drivers and their listed starting fares.</p>
            </motion.article>

            <motion.article className="step-card" whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <span className="step-number">03</span>
              <span className="step-icon" aria-hidden="true">✓</span>
              <h3>Request a booking</h3>
              <p>Choose a driver and continue to the booking form.</p>
            </motion.article>
          </div>
        </section>

        <section className="luxury-bottom-cta">
          <div>
            <span className="section-kicker">YOUR NEXT JOURNEY</span>
            <h2>Good journeys begin close to home.</h2>
          </div>

          <Link className="btn btn-primary" to="/drivers">
            Find a driver <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <footer className="footer luxury-footer">
        <Link className="brand footer-brand" to="/customer/dashboard">
          <span className="brand-icon">L</span>
          <span>local<span className="brand-accent">ride</span></span>
        </Link>

        <p>Connecting local drivers with everyday journeys.</p>
        <span>© {new Date().getFullYear()} LocalRide · Student project prototype</span>
      </footer>

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss message" type="button">×</button>
        </div>
      )}
    </div>
  )
}
