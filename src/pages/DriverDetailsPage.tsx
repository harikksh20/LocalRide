
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react'
import '../App.css'

import { mockDrivers, type Driver } from '../data/mockDrivers'
import { useDriverContext } from '../context/DriverContext'

export default function DriverDetailsPage() {
  const { driverId } = useParams()
  const navigate = useNavigate()
  const { drivers: registeredDrivers } = useDriverContext()

  const convertedDrivers: Driver[] = registeredDrivers.map((registered) => {
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

  const registeredIndex = convertedDrivers.findIndex(
    (driver) => String(driver.id) === driverId,
  )

  const registeredDriver =
    registeredIndex >= 0 ? registeredDrivers[registeredIndex] : undefined

  const mockDriver = mockDrivers.find(
    (driver) => String(driver.id) === driverId,
  )

  const driver = registeredIndex >= 0
    ? convertedDrivers[registeredIndex]
    : mockDriver

  if (!driver) {
    return (
      <main className="driver-profile-page">
        <Link to="/drivers" className="driver-profile-back">
          <ArrowLeft size={18} />
          Back to drivers
        </Link>

        <section className="driver-profile-card driver-profile-not-found">
          <span className="driver-profile-icon">
            <Truck size={32} />
          </span>
          <h1>Driver not found</h1>
          <p>This driver may no longer be available.</p>
          <Link to="/drivers" className="driver-profile-primary">
            Browse drivers <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    )
  }

  const vehicleDescription: Record<string, string> = {
    Auto: 'Perfect for everyday local trips',
    Car: 'Comfortable rides for your journey',
    Pickup: 'Ideal for goods and small loads',
    Lorry: 'For heavy goods and transportation',
  }

  return (
    <main className="driver-profile-page">
      <div className="driver-profile-topbar">
        <button
          type="button"
          className="driver-profile-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <Link to="/" className="driver-profile-brand">
          Local<span>Ride</span>
        </Link>
      </div>

      <div className="driver-profile-layout">
        <section className="driver-profile-card">
          <div className="driver-profile-cover">
            <div className="driver-profile-cover-label">
              <ShieldCheck size={16} />
              Trusted local transport
            </div>

            <div className="driver-profile-vehicle-art">
              <Truck size={86} strokeWidth={1.25} />
            </div>
          </div>

          <div className="driver-profile-main">
            <div className="driver-profile-avatar">
              {driver.name.charAt(0).toUpperCase()}
            </div>

            <div className="driver-profile-identity">
              <div className="driver-profile-status">
                <span
                  className={
                    driver.available
                      ? 'driver-profile-status-dot'
                      : 'driver-profile-status-dot is-busy'
                  }
                />
                {driver.available ? 'Available for booking' : 'Currently busy'}
              </div>

              <h1>{driver.name}</h1>

              <p className="driver-profile-subtitle">
                LocalRide driver · {driver.vehicle}
              </p>

              <div className="driver-profile-rating">
                <Star size={17} fill="currentColor" />
                <strong>{driver.rating.toFixed(1)}</strong>
                <span>Demo rating</span>
              </div>
            </div>
          </div>

          <div className="driver-profile-divider" />

          <div className="driver-profile-section">
            <h2>Driver information</h2>

            <div className="driver-profile-info-grid">
              <div className="driver-profile-info">
                <span className="driver-profile-info-icon">
                  <Truck size={20} />
                </span>
                <div>
                  <span>Vehicle type</span>
                  <strong>{driver.vehicle}</strong>
                </div>
              </div>

              <div className="driver-profile-info">
                <span className="driver-profile-info-icon">
                  <MapPin size={20} />
                </span>
                <div>
                  <span>Service area</span>
                  <strong>{driver.area}</strong>
                </div>
              </div>

              <div className="driver-profile-info">
                <span className="driver-profile-info-icon">
                  <Star size={20} />
                </span>
                <div>
                  <span>Driver rating</span>
                  <strong>{driver.rating.toFixed(1)} / 5.0</strong>
                </div>
              </div>

              <div className="driver-profile-info">
                <span className="driver-profile-info-icon">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <span>Completed trips</span>
                  <strong>{driver.trips.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="driver-profile-description">
            <h2>About this service</h2>
            <p>
              {vehicleDescription[driver.vehicle] ??
                'Reliable local transport for your journey.'}
              {' '}Book directly through LocalRide to submit your trip request.
            </p>
          </div>
        </section>

        <aside className="driver-profile-booking-card">
          <span className="driver-profile-booking-kicker">
            YOUR JOURNEY STARTS HERE
          </span>

          <h2>Ready to book?</h2>

          <p>
            Review the starting fare and book this driver for your next trip.
          </p>

          <div className="driver-profile-fare">
            <span>Starting fare</span>
            <div>
              <strong>
                ₹{driver.fare.toLocaleString('en-IN')}
              </strong>
              <span> / estimated</span>
            </div>
          </div>

          <div className="driver-profile-booking-detail">
            <MapPin size={17} />
            <span>Service area</span>
            <strong>{driver.area}</strong>
          </div>

          <div className="driver-profile-booking-detail">
            <Truck size={17} />
            <span>Vehicle</span>
            <strong>{driver.vehicle}</strong>
          </div>

          <button
            type="button"
            className="driver-profile-primary"
            disabled={!driver.available}
            onClick={() => {
              const bookingId = registeredDriver?.id ?? driver.id
              navigate(`/booking/${bookingId}`)
            }}
          >
            <CalendarCheck size={19} />
            Book this driver
            <ArrowRight size={18} />
          </button>

          <p className="driver-profile-booking-note">
            Final fare depends on the estimated journey distance and vehicle
            type. This is a demo booking system.
          </p>
        </aside>
      </div>

      <footer className="driver-profile-footer">
        <Link to="/" className="driver-profile-brand">
          Local<span>Ride</span>
        </Link>
        <p>Connecting local drivers with everyday journeys.</p>
      </footer>
    </main>
  )
}
