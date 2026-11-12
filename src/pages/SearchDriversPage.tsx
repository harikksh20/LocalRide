import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import '../App.css'

import type { Driver, VehicleType } from '../data/mockDrivers'
import { useDriverContext } from '../context/DriverContext'

import DriverCard from '../components/drivers/DriverCard'
import DriverFilters from '../components/drivers/DriverFilters'
import VehicleCategories from '../components/drivers/VehicleCategories'

export default function SearchDriversPage() {
  const [area, setArea] = useState('')
  const [searchArea, setSearchArea] = useState('')
  const [vehicle, setVehicle] = useState<VehicleType>('All')
  const [availableOnly, setAvailableOnly] = useState(true)

  const navigate = useNavigate()

  const {
    drivers: registeredDrivers,
    loading,
    error,
    refreshDrivers,
  } = useDriverContext()

  // Only use real drivers returned by the Flask/SQLite backend.
  // Keep the same numeric route IDs expected by the existing details/booking pages.
  const allDrivers = useMemo<Driver[]>(() => {
    return registeredDrivers.map((registered) => {
      let hash = 0

      for (let i = 0; i < registered.id.length; i++) {
        hash = (hash * 31 + registered.id.charCodeAt(i)) >>> 0
      }

      return {
        id: 1_000_000 + (hash % 1_000_000_000),
        name: registered.name,
        vehicle: registered.vehicle,
        area: registered.area,
        fare: registered.fare,
        rating: 5,
        available: true,
        trips: 0,
      }
    })
  }, [registeredDrivers])

  const filteredDrivers = useMemo(() => {
    if (!searchArea.trim()) return []

    return allDrivers.filter((driver) => {
      const matchesArea = driver.area
        .toLowerCase()
        .includes(searchArea.trim().toLowerCase())

      const matchesVehicle =
        vehicle === 'All' || driver.vehicle === vehicle

      const matchesAvailability =
        !availableOnly || driver.available

      return matchesArea && matchesVehicle && matchesAvailability
    })
  }, [allDrivers, searchArea, vehicle, availableOnly])

  function handleBooking(driverId: number) {
    const selectedDriver = allDrivers.find(
      (driver) => driver.id === driverId,
    )

    if (!selectedDriver || !selectedDriver.available) return

    navigate(`/driver/${selectedDriver.id}`)
  }

  function clearFilters() {
    setArea('')
    setSearchArea('')
    setVehicle('All')
    setAvailableOnly(true)
  }

  return (
    <div className="app">
      <header className="navbar">
        <Link className="brand" to="/" aria-label="LocalRide home">
          <span className="brand-icon">L</span>
          <span>
            local<span className="brand-accent">ride</span>
          </span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link className="nav-active" to="/drivers">
            Find Drivers
          </Link>
          <Link to="/my-bookings">My Bookings</Link>
          <Link to="/driver/register">Become a driver</Link>
        </nav>
      </header>

      <main className="drivers-section search-page">
        <div className="section-header">
          <div>
            <span className="section-kicker">FIND YOUR DRIVER</span>
            <h2>Drivers in your area</h2>
            <p className="section-description">
              Search your location and choose the right vehicle.
            </p>
          </div>
        </div>

        <form
          className="search-bar"
          onSubmit={(event) => {
            event.preventDefault()
            setSearchArea(area.trim())
          }}
        >
          <label className="search-field">
            <span className="field-icon">⌖</span>
            <span className="field-content">
              <span className="field-label">YOUR AREA</span>
              <input
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="Rasipuram, Namakkal, Salem..."
                aria-label="Search area"
                required
              />
            </span>
          </label>

          <button
            className="btn btn-primary search-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Search drivers →'}
          </button>
        </form>

        <p className="search-hint">
          Enter an area and search to see drivers registered with LocalRide.
        </p>

        {error && (
          <div className="registration-message registration-error" role="alert">
            <p>
              Could not load registered drivers from the backend: {error}
            </p>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                void refreshDrivers().catch(() => {
                  // The context exposes the latest error.
                })
              }}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry connection'}
            </button>
          </div>
        )}

        <div className="section-header search-filter-header">
          <h2>Filter drivers</h2>
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
          <h3>
            {searchArea
              ? `Drivers near ${searchArea}`
              : 'Search your area to see drivers'}
          </h3>

          <span className="results-count">
            {searchArea
              ? `${filteredDrivers.length} ${filteredDrivers.length === 1 ? 'driver' : 'drivers'} found`
              : 'Search required'}
          </span>
        </div>

        {loading && (
          <p role="status">
            Loading registered drivers from LocalRide...
          </p>
        )}

        {!loading && searchArea && filteredDrivers.length > 0 ? (
          <div className="driver-grid">
            {filteredDrivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onBook={() => handleBooking(driver.id)}
              />
            ))}
          </div>
        ) : !loading && searchArea ? (
          <div className="empty-state">
            <span>🔎</span>
            <h3>No registered drivers found</h3>
            <p>
              Try another area or change your vehicle filters. Sample drivers
              are not bookable and are not shown in these results.
            </p>

            <button
              className="btn btn-outline"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        <p className="demo-note">
          Only drivers registered through the LocalRide backend are shown.
          Ratings, availability and trip counts are currently demo defaults.
        </p>
      </main>

      <footer className="footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-icon">L</span>
          <span>
            local<span className="brand-accent">ride</span>
          </span>
        </Link>

        <p>Connecting local drivers with everyday journeys.</p>

        <span>
          © {new Date().getFullYear()} LocalRide · Student project
          prototype
        </span>
      </footer>
    </div>
  )
}
