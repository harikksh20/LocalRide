
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

import {
  cancelCustomerBooking,
  fetchCustomerBookings,
} from '../services/driverApi'
import type { SavedBooking } from '../services/driverApi'

const vehicleIcons: Record<string, string> = {
  Auto: '🛺',
  Car: '🚗',
  Pickup: '🛻',
  Lorry: '🚚',
}

const statusFilters = [
  'All',
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
] as const

type StatusFilter = (typeof statusFilters)[number]

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<SavedBooking[]>([])
  const [customerPhone, setCustomerPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('All')

  async function loadBookings(phone: string) {
    const normalizedPhone = phone.trim()

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)
    setError('')
    setHasSearched(true)
    setSearchedPhone(normalizedPhone)
    setBookings([])

    try {
      const savedBookings =
        await fetchCustomerBookings(normalizedPhone)

      setBookings(savedBookings)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your bookings.',
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...bookings]
      .filter((booking) => {
        const matchesStatus =
          statusFilter === 'All' ||
          booking.status === statusFilter

        const searchableText = [
          booking.reference,
          booking.driverName,
          booking.vehicle,
          booking.area,
          booking.pickup,
          booking.destination,
        ]
          .join(' ')
          .toLowerCase()

        return (
          matchesStatus &&
          searchableText.includes(query)
        )
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

  async function handleCancel(bookingId: string) {
    if (!searchedPhone) {
      setError('Search for your bookings first.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking request?',
    )

    if (!confirmed) return

    setCancellingId(bookingId)
    setError('')

    try {
      await cancelCustomerBooking(bookingId, searchedPhone)
      await loadBookings(searchedPhone)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not cancel this booking.',
      )
    } finally {
      setCancellingId(null)
    }
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
          <Link to="/drivers">Find Drivers</Link>
          <Link className="nav-active" to="/my-bookings">
            My Bookings
          </Link>
        </nav>
      </header>

      <main className="my-bookings-page">
        <div className="my-bookings-heading">
          <span className="section-kicker">YOUR JOURNEYS</span>
          <h1>My Bookings</h1>
          <p>
            Track your journeys, review booking details, and manage
            your travel requests.
          </p>
        </div>

        <form
          className="booking-toolbar"
          onSubmit={(event) => {
            event.preventDefault()
            void loadBookings(customerPhone)
          }}
        >
          <div className="booking-search">
            <label htmlFor="customer-phone">
              Booking contact number
            </label>
            <input
              id="customer-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              value={customerPhone}
              onChange={(event) =>
                setCustomerPhone(
                  event.target.value.replace(/\D/g, '').slice(0, 10),
                )
              }
              placeholder="Enter the number used for booking"
              title="Enter a valid 10-digit Indian mobile number"
              required
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Find my bookings'}
          </button>
        </form>

        {hasSearched && !error && (
          <section className="booking-summary-grid">
            <article className="booking-summary-card">
              <span>Total bookings</span>
              <strong>{bookings.length}</strong>
              <small>All booking requests</small>
            </article>

            <article className="booking-summary-card">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
              <small>Awaiting confirmation</small>
            </article>

            <article className="booking-summary-card">
              <span>Confirmed</span>
              <strong>{confirmedCount}</strong>
              <small>Confirmed requests</small>
            </article>

            <article className="booking-summary-card">
              <span>Completed</span>
              <strong>{completedCount}</strong>
              <small>Finished journeys</small>
            </article>
          </section>
        )}

        {error && (
          <section className="my-bookings-empty" role="alert">
            <h2>Unable to load bookings</h2>
            <p>{error}</p>

            {hasSearched && (
              <button
                className="btn btn-primary"
                type="button"
                disabled={loading}
                onClick={() => void loadBookings(searchedPhone)}
              >
                {loading ? 'Loading...' : 'Retry'}
              </button>
            )}
          </section>
        )}

        {loading && (
          <section className="my-bookings-empty" role="status">
            <h2>Loading your bookings...</h2>
            <p>Retrieving your journeys from the LocalRide database.</p>
          </section>
        )}

        {hasSearched && !loading && !error && (
          <>
            <section className="booking-toolbar">
              <div className="booking-search">
                <label htmlFor="booking-search">
                  Search bookings
                </label>
                <input
                  id="booking-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search driver, location or reference..."
                />
              </div>

              <div className="booking-status-filter">
                <label htmlFor="booking-status">
                  Filter by status
                </label>
                <select
                  id="booking-status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter,
                    )
                  }
                >
                  {statusFilters.map((status) => (
                    <option key={status} value={status}>
                      {status === 'All' ? 'All statuses' : status}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <div className="booking-results-heading">
              <h2>
                {statusFilter === 'All'
                  ? 'Your journeys'
                  : `${statusFilter} bookings`}
              </h2>
              <span>
                {filteredBookings.length}{' '}
                {filteredBookings.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {bookings.length === 0 ? (
              <section className="my-bookings-empty">
                <div className="my-bookings-empty-icon">🛣️</div>
                <h2>No bookings yet</h2>
                <p>
                  We couldn't find any bookings associated with this
                  phone number.
                </p>
                <Link className="btn btn-primary" to="/drivers">
                  Find a driver →
                </Link>
              </section>
            ) : filteredBookings.length === 0 ? (
              <section className="my-bookings-empty">
                <div className="my-bookings-empty-icon">🔎</div>
                <h2>No matching bookings</h2>
                <p>
                  Try another search term or choose a different status.
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('All')
                  }}
                >
                  Clear filters
                </button>
              </section>
            ) : (
              <div className="my-bookings-list">
                {filteredBookings.map((booking) => (
                  <article className="my-booking-card" key={booking.id}>
                    <div className="my-booking-top">
                      <div className="my-booking-driver">
                        <div className="my-booking-vehicle">
                          {vehicleIcons[booking.vehicle] ?? '🚘'}
                        </div>

                        <div>
                          <h2>{booking.driverName}</h2>
                          <p>
                            {booking.vehicle} driver · {booking.area}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`booking-status status-${booking.status.toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="my-booking-route">
                      <div className="route-point">
                        <span className="route-dot pickup-dot" />
                        <div>
                          <span>Pickup</span>
                          <strong>{booking.pickup}</strong>
                        </div>
                      </div>

                      <div className="route-point">
                        <span className="route-dot destination-dot" />
                        <div>
                          <span>Destination</span>
                          <strong>{booking.destination}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="my-booking-details">
                      <div>
                        <span>Travel date</span>
                        <strong>
                          {new Date(
                            `${booking.date}T00:00:00`,
                          ).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>

                      <div>
                        <span>Estimated fare</span>
                        <strong className="my-booking-fare">
                          ₹{booking.fare.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <div>
                        <span>Booking reference</span>
                        <strong>{booking.reference}</strong>
                      </div>
                    </div>

                    <div className="my-booking-bottom">
                      <p>
                        Requested on{' '}
                        {new Date(booking.createdAt).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          },
                        )}
                      </p>

                      {booking.status === 'Pending' && (
                        <button
                          className="btn btn-outline"
                          type="button"
                          disabled={cancellingId === booking.id}
                          onClick={() => void handleCancel(booking.id)}
                        >
                          {cancellingId === booking.id
                            ? 'Cancelling...'
                            : 'Cancel request'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {!hasSearched && !loading && !error && (
          <section className="my-bookings-empty">
            <div className="my-bookings-empty-icon">🔎</div>
            <h2>Find your journeys</h2>
            <p>
              Enter the mobile number you used when creating your booking
              to view your journey details.
            </p>
          </section>
        )}

        <p className="my-bookings-disclaimer">
          Bookings are retrieved from the LocalRide database. Drivers
          are not notified, and displayed fares are estimates.
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
      </footer>
    </div>
  )
}
