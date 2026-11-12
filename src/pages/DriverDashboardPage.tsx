
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CarFront,
  Check,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  RefreshCw,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import {
  cancelSavedBooking,
  fetchBookings,
  updateBookingStatus,
} from '../services/driverApi'
import type {
  RegisteredDriver,
  SavedBooking,
} from '../services/driverApi'
import '../App.css'

const vehicleIcons: Record<string, string> = {
  Auto: '🛺',
  Car: '🚗',
  Pickup: '🛻',
  Lorry: '🚚',
}

function readLoggedInDriver(): RegisteredDriver | null {
  try {
    const rawDriver = sessionStorage.getItem('localride-authenticated-driver')

    if (!rawDriver) return null

    const driver = JSON.parse(rawDriver) as RegisteredDriver

    if (!driver.id || !driver.name) return null

    return driver
  } catch {
    return null
  }
}

function formatDate(value: string) {
  if (!value) return 'Not provided'

  const date = new Date(`${value.slice(0, 10)}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatFare(value: number | string) {
  const fare = Number(value)

  if (!Number.isFinite(fare)) return '—'

  return `₹${fare.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

export default function DriverDashboard() {
  const navigate = useNavigate()

  const [driver, setDriver] = useState<RegisteredDriver | null>(
    readLoggedInDriver,
  )
  const [bookings, setBookings] = useState<SavedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const loadDashboard = useCallback(async () => {
    setError('')

    const currentDriver = readLoggedInDriver()

    if (!currentDriver) {
      setDriver(null)
      setBookings([])
      setLoading(false)
      return
    }

    setDriver(currentDriver)
    setLoading(true)

    try {
      // Flask filters these results to the authenticated driver.
      const bookingData = await fetchBookings()
      setBookings(bookingData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your booking requests.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...bookings]
      .filter((booking) => {
        const matchesStatus =
          statusFilter === 'All' || booking.status === statusFilter

        const searchable = [
          booking.reference,
          booking.pickup,
          booking.destination,
          booking.vehicle,
          booking.area,
          booking.phone,
        ]
          .join(' ')
          .toLowerCase()

        return matchesStatus && searchable.includes(query)
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
  }, [bookings, search, statusFilter])

  const pendingCount = bookings.filter(
    (booking) => booking.status === 'Pending',
  ).length

  const confirmedCount = bookings.filter(
    (booking) => booking.status === 'Confirmed',
  ).length

  const completedCount = bookings.filter(
    (booking) => booking.status === 'Completed',
  ).length

  const stats = [
    {
      label: 'Total requests',
      value: bookings.length,
      icon: <Truck size={21} />,
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: <Clock3 size={21} />,
    },
    {
      label: 'Confirmed',
      value: confirmedCount,
      icon: <CheckCircle2 size={21} />,
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: <Check size={21} />,
    },
  ]

  async function performBookingAction(
    bookingId: string,
    action: 'confirm' | 'complete' | 'reject',
  ) {
    if (action === 'reject') {
      const confirmed = window.confirm(
        'Reject this booking request? It will be marked as cancelled.',
      )

      if (!confirmed) return
    }

    setActionLoading(bookingId)
    setActionError('')
    setSuccessMessage('')

    try {
      if (action === 'confirm') {
        await updateBookingStatus(bookingId, 'Confirmed')
        setSuccessMessage('Booking confirmed successfully.')
      } else if (action === 'complete') {
        await updateBookingStatus(bookingId, 'Completed')
        setSuccessMessage('Ride marked as completed.')
      } else {
        await cancelSavedBooking(bookingId)
        setSuccessMessage('Booking request rejected.')
      }

      await loadDashboard()
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Could not update this booking.',
      )
    } finally {
      setActionLoading(null)
    }
  }

  function handleLogout() {
  sessionStorage.removeItem('localride-driver-token')
  sessionStorage.removeItem('localride-authenticated-driver')
  sessionStorage.removeItem('localride-driver')

  setDriver(null)
  setBookings([])

  navigate('/driver/login', { replace: true })
}

  if (!driver) {
    return (
      <div className="driver-dashboard">
        <header className="dashboard-header">
          <Link to="/" className="brand">
            <span className="brand-icon">L</span>
            <span>LocalRide</span>
          </Link>
        </header>

        <main className="dashboard-main">
          <section className="dashboard-empty">
            <div className="dashboard-empty-icon">
              <UserRound size={28} />
            </div>
            <h2>Driver login required</h2>
            <p>
              Please log in with your registered driver account to view
              your dashboard and manage your ride requests.
            </p>
            <Link className="btn btn-primary" to="/driver/login">
              Log in as driver
            </Link>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="driver-dashboard">
      <header className="dashboard-header">
        <Link to="/" className="brand">
          <span className="brand-icon">L</span>
          <span>LocalRide</span>
        </Link>

        <div className="dashboard-header-actions">
          <Link to="/drivers" className="dashboard-back-link">
            <ArrowLeft size={17} />
            Find drivers
          </Link>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">DRIVER PORTAL</p>
            <h1>Welcome, {driver.name} 👋</h1>
            <p>Manage your ride requests and track your journeys.</p>
          </div>

          <span className="dashboard-availability is-available">
            <span className="availability-dot" />
            Logged in
          </span>
        </section>

        <section className="dashboard-profile">
          <div className="dashboard-avatar">
            <UserRound size={36} />
          </div>

          <div className="dashboard-profile-info">
            <h2>{driver.name}</h2>
            <p>
              <MapPin size={16} />
              {driver.area}
            </p>
            <p>
              <CarFront size={16} />
              {driver.vehicle} driver
            </p>
            <p>{driver.phone}</p>
          </div>

          <div className="dashboard-fare">
            <span>Registered starting fare</span>
            <strong>{formatFare(driver.fare)}</strong>
            <small>As saved in your driver profile</small>
          </div>
        </section>

        <section className="dashboard-stats">
          {stats.map((stat) => (
            <article className="dashboard-stat-card" key={stat.label}>
              <div className="dashboard-stat-icon">{stat.icon}</div>
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
            </article>
          ))}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Booking requests</h2>
              <p>Review requests and update their status.</p>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void loadDashboard()}
              disabled={loading || actionLoading !== null}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="dashboard-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => void loadDashboard()}
              >
                Try again
              </button>
            </div>
          )}

          {actionError && (
            <div className="dashboard-error" role="alert">
              {actionError}
            </div>
          )}

          {successMessage && (
            <div className="dashboard-success" role="status">
              {successMessage}
            </div>
          )}

          <div className="dashboard-toolbar">
            <label>
              <span>Search requests</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search location or reference..."
              />
            </label>

            <label>
              <span>Booking status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty" role="status">
              <h3>Loading your requests...</h3>
              <p>Connecting to the LocalRide database.</p>
            </div>
          ) : !error && bookings.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                <Truck size={28} />
              </div>
              <h3>No booking requests yet</h3>
              <p>
                New customer requests assigned to your driver account will
                appear here.
              </p>
              <Link className="btn btn-primary" to="/drivers">
                View drivers
              </Link>
            </div>
          ) : !error && filteredBookings.length === 0 ? (
            <div className="dashboard-empty">
              <h3>No matching requests</h3>
              <p>Try another search or status filter.</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('All')
                }}
              >
                Clear filters
              </button>
            </div>
          ) : !error ? (
            <div className="driver-request-list">
              {filteredBookings.map((booking) => {
                const isBusy = actionLoading === booking.id

                return (
                  <article
                    className="driver-request-card"
                    key={booking.id}
                  >
                    <div className="driver-request-header">
                      <div>
                        <span className="driver-request-reference">
                          {booking.reference}
                        </span>
                        <h3>
                          {booking.pickup} → {booking.destination}
                        </h3>
                        <p>
                          {vehicleIcons[booking.vehicle] ?? '🚘'}{' '}
                          {booking.vehicle} · {booking.area}
                        </p>
                      </div>

                      <span
                        className={`booking-status status-${booking.status.toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="driver-request-details">
                      <div>
                        <span>Travel date</span>
                        <strong>{formatDate(booking.date)}</strong>
                      </div>

                      <div>
                        <span>Customer phone</span>
                        <strong>{booking.phone || 'Not provided'}</strong>
                      </div>

                      <div>
                        <span>Estimated fare</span>
                        <strong>{formatFare(booking.fare)}</strong>
                      </div>
                    </div>

                    {booking.status === 'Pending' && (
                      <div className="driver-request-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={isBusy}
                          onClick={() =>
                            void performBookingAction(booking.id, 'confirm')
                          }
                        >
                          <Check size={17} />
                          {isBusy ? 'Updating...' : 'Confirm request'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={isBusy}
                          onClick={() =>
                            void performBookingAction(booking.id, 'reject')
                          }
                        >
                          <X size={17} />
                          Reject request
                        </button>
                      </div>
                    )}

                    {booking.status === 'Confirmed' && (
                      <div className="driver-request-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={isBusy}
                          onClick={() =>
                            void performBookingAction(booking.id, 'complete')
                          }
                        >
                          <CheckCircle2 size={17} />
                          {isBusy ? 'Updating...' : 'Mark as completed'}
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : null}
        </section>

        <section className="dashboard-section dashboard-quick-links">
          <h2>Quick links</h2>
          <div className="dashboard-links-grid">
            <Link to="/driver/register">
              <UserRound size={19} />
              Driver registration
            </Link>
            <Link to="/drivers">
              <CarFront size={19} />
              Find drivers
            </Link>
            <Link to="/">
              <Truck size={19} />
              LocalRide home
            </Link>
          </div>
        </section>

        <p className="dashboard-demo-note">
          Booking changes are saved through the LocalRide API. The customer
          is not automatically notified yet.
        </p>
      </main>
    </div>
  )
}
