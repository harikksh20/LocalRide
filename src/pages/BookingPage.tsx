
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useDriverContext } from '../context/DriverContext'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import type { Driver } from '../data/mockDrivers'
import {
  calculateFare,
  fareRates,
  formatFare,
} from '../utils/fareCalculator'
import { createBooking } from '../services/driverApi'
import '../App.css'

type BookingDetails = {
  pickup: string
  destination: string
  distance: string
  date: string
  phone: string
}

export default function BookingPage() {
  const { driverId } = useParams<{ driverId: string }>()
  const navigate = useNavigate()
  const { drivers: registeredDrivers, loading } = useDriverContext()
  const { user } = useCustomerAuth()

  const [details, setDetails] = useState<BookingDetails>({
    pickup: '',
    destination: '',
    distance: '10',
    date: '',
    phone: '',
  })

  const [confirmation, setConfirmation] = useState('')
  const [bookingReference, setBookingReference] = useState('')
  const [hasError, setHasError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const convertedDrivers = registeredDrivers.map((registered) => {
    let hash = 0

    for (let i = 0; i < registered.id.length; i++) {
      hash = (hash * 31 + registered.id.charCodeAt(i)) >>> 0
    }

    const driver: Driver = {
      id: 1_000_000 + (hash % 1_000_000_000),
      name: registered.name,
      vehicle: registered.vehicle,
      area: registered.area,
      fare: registered.fare,
      rating: 5,
      available: true,
      trips: 0,
    }

    return { registered, driver }
  })

  const numericDriverId = Number(driverId)

  const registeredMatch = convertedDrivers.find(
    ({ registered, driver }) =>
      registered.id === driverId ||
      (Number.isInteger(numericDriverId) &&
        driver.id === numericDriverId),
  )

  const selectedDriver: Driver | undefined = registeredMatch?.driver
  const selectedRegisteredDriver = registeredMatch?.registered

  const today = new Date()

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const distanceKm = Number(details.distance)

  const validDistance =
    details.distance.trim() !== '' &&
    Number.isFinite(distanceKm) &&
    distanceKm > 0 &&
    distanceKm <= 10000

  const estimatedFare =
    selectedDriver && validDistance
      ? calculateFare(selectedDriver.vehicle, distanceKm)
      : null

  const pricing = selectedDriver
    ? fareRates[selectedDriver.vehicle]
    : null

  // Use the authenticated customer's Firebase profile.
  // Fall back to their email prefix if they have no display name.
  const emailName = user?.email?.split('@')[0]?.trim() ?? ''
  const profileName = user?.displayName?.trim() ?? ''

  const customerName =
    profileName.length >= 2
      ? profileName
      : emailName.length >= 2
        ? emailName
        : 'Customer'

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setDetails((previous) => ({
      ...previous,
      [name]: value,
    }))

    setConfirmation('')
    setBookingReference('')
    setHasError(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    setConfirmation('')
    setBookingReference('')
    setHasError(false)

    if (!user) {
      setHasError(true)
      setConfirmation('Please sign in before requesting a booking.')
      return
    }

    if (!selectedDriver || !selectedRegisteredDriver) {
      setHasError(true)
      setConfirmation(
        'Driver not found. Please select a registered driver again.',
      )
      return
    }

    if (!selectedDriver.available) {
      setHasError(true)
      setConfirmation(
        'This driver is currently unavailable. Please select another driver.',
      )
      return
    }

    if (
      details.pickup.trim().length < 2 ||
      details.destination.trim().length < 2
    ) {
      setHasError(true)
      setConfirmation('Enter valid pickup and destination locations.')
      return
    }

    if (!validDistance) {
      setHasError(true)
      setConfirmation(
        'Enter a valid journey distance greater than 0 km and no more than 10,000 km.',
      )
      return
    }

    if (estimatedFare === null || estimatedFare <= 0) {
      setHasError(true)
      setConfirmation('Unable to calculate the journey fare.')
      return
    }

    if (!/^[6-9]\d{9}$/.test(details.phone.trim())) {
      setHasError(true)
      setConfirmation('Enter a valid 10-digit Indian mobile number.')
      return
    }

    if (!details.date || details.date < todayString) {
      setHasError(true)
      setConfirmation('Please select today or a future travel date.')
      return
    }

    setSubmitting(true)

    try {
      const savedBooking = await createBooking({
        driverId: selectedRegisteredDriver.id,
        customerName,
        pickup: details.pickup.trim(),
        destination: details.destination.trim(),
        distance: distanceKm,
        date: details.date,
        phone: details.phone.trim(),
      })

      setBookingReference(savedBooking.reference)
      setConfirmation(
        `Your booking request for ${savedBooking.driverName} has been saved with an estimated fare of ${formatFare(savedBooking.fare)}.`,
      )
    } catch (err) {
      setHasError(true)
      setConfirmation(
        err instanceof Error
          ? err.message
          : 'Could not save your booking. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedDriver) {
    return (
      <div className="app">
        <header className="navbar">
          <Link className="brand" to="/customer/dashboard">
            <span className="brand-icon">L</span>
            <span>
              local<span className="brand-accent">ride</span>
            </span>
          </Link>
        </header>

        <main className="registration-page">
          <div className="empty-state">
            <span>🔎</span>
            <h2>{loading ? 'Loading driver...' : 'Driver not found'}</h2>
            <p>
              {loading
                ? 'Please wait while LocalRide loads registered drivers.'
                : 'This driver could not be found. Please select a driver from the listings.'}
            </p>
            <Link className="btn btn-primary" to="/drivers">
              Find drivers
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="navbar">
        <Link className="brand" to="/customer/dashboard" aria-label="LocalRide home">
          <span className="brand-icon">L</span>
          <span>
            local<span className="brand-accent">ride</span>
          </span>
        </Link>

        <nav className="nav-links">
          <Link to="/customer/dashboard">Home</Link>
          <Link to="/drivers">Find Drivers</Link>
          <Link to="/my-bookings">My Bookings</Link>
        </nav>
      </header>

      <main className="registration-page">
        <div className="registration-heading">
          <span className="section-kicker">PLAN YOUR JOURNEY</span>
          <h1>Book your ride</h1>
          <p>
            Enter your trip details to estimate the fare and create a
            booking request.
          </p>
        </div>

        <section className="registration-form">
          <div className="registration-form-heading">
            <h2>Selected driver</h2>
            <p>
              {selectedDriver.name} · {selectedDriver.vehicle} ·{' '}
              {selectedDriver.area}
            </p>
            <p>
              {selectedDriver.available
                ? '🟢 Available'
                : '🔴 Currently busy'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="registration-field">
              Pickup location
              <input
                type="text"
                name="pickup"
                value={details.pickup}
                onChange={handleChange}
                placeholder="Enter pickup location"
                autoComplete="street-address"
                minLength={2}
                required
              />
            </label>

            <label className="registration-field">
              Destination
              <input
                type="text"
                name="destination"
                value={details.destination}
                onChange={handleChange}
                placeholder="Where are you going?"
                minLength={2}
                required
              />
            </label>

            <label className="registration-field">
              Estimated journey distance (km)
              <input
                type="number"
                name="distance"
                value={details.distance}
                onChange={handleChange}
                placeholder="Enter distance in kilometres"
                min="0.1"
                max="10000"
                step="0.1"
                required
              />
            </label>

            <section className="booking-fare-panel">
              <div className="booking-fare-heading">
                <span className="section-kicker">FARE ESTIMATE</span>
                <h2>Your journey fare</h2>
              </div>

              <div className="booking-fare-row">
                <span>Vehicle</span>
                <strong>{selectedDriver.vehicle}</strong>
              </div>

              <div className="booking-fare-row">
                <span>Base fare</span>
                <strong>
                  {pricing ? formatFare(pricing.baseFare) : '—'}
                </strong>
              </div>

              <div className="booking-fare-row">
                <span>Distance</span>
                <strong>
                  {validDistance ? `${distanceKm} km` : '—'}
                </strong>
              </div>

              <div className="booking-fare-row">
                <span>Rate per km</span>
                <strong>
                  {pricing ? formatFare(pricing.ratePerKm) : '—'}
                </strong>
              </div>

              <div className="booking-fare-total">
                <span>Estimated total</span>
                <strong>
                  {estimatedFare === null
                    ? 'Enter a valid distance'
                    : formatFare(estimatedFare)}
                </strong>
              </div>

              <p className="booking-fare-note">
                Demo estimate based on manually entered distance.
                Actual road distance, tolls and additional charges
                are not included.
              </p>
            </section>

            <label className="registration-field">
              Travel date
              <input
                type="date"
                name="date"
                value={details.date}
                min={todayString}
                onChange={handleChange}
                required
              />
            </label>

            <label className="registration-field">
              Contact mobile number
              <input
                type="tel"
                name="phone"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                title="Enter a valid 10-digit Indian mobile number"
                value={details.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                required
              />
            </label>

            {confirmation && (
              <div
                className={`registration-message ${
                  hasError ? 'booking-error' : 'booking-success'
                }`}
                role="status"
                aria-live="polite"
              >
                <p>{confirmation}</p>

                {bookingReference && (
                  <>
                    <p>
                      Booking reference:{' '}
                      <strong>{bookingReference}</strong>
                    </p>

                    <Link
                      className="btn btn-primary"
                      to="/my-bookings"
                      style={{ marginTop: '12px' }}
                    >
                      View my bookings →
                    </Link>
                  </>
                )}
              </div>
            )}

            <button
              className="btn btn-primary registration-submit"
              type="submit"
              disabled={!selectedDriver.available || submitting}
            >
              {submitting ? 'Saving booking...' : 'Request booking →'}
            </button>

            <p className="registration-note">
              Bookings for registered drivers are saved to the LocalRide
              database. The driver is not notified yet, and the displayed
              fare is an estimate.
            </p>
          </form>

          <button
            className="registration-back"
            type="button"
            onClick={() => navigate('/drivers')}
          >
            ← Back to drivers
          </button>
        </section>
      </main>

      <footer className="footer">
        <Link className="brand footer-brand" to="/customer/dashboard">
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
