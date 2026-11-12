
import type { Driver } from '../../data/mockDrivers'

type DriverCardProps = {
  driver: Driver
  onBook: (driver: Driver) => void
}

const vehicleIcons: Record<Driver['vehicle'], string> = {
  Auto: '🛺',
  Car: '🚗',
  Pickup: '🛻',
  Lorry: '🚚',
}

export default function DriverCard({
  driver,
  onBook,
}: DriverCardProps) {
  return (
    <article className="driver-card">
      <div className="driver-card-top">
        <div className="driver-avatar">
          {driver.name.charAt(0)}
        </div>

        <div className="driver-identity">
          <h3>{driver.name}</h3>
          <p>
            {vehicleIcons[driver.vehicle]} {driver.vehicle} driver
          </p>
        </div>

        <span
          className={`availability-badge ${
            driver.available ? 'is-available' : 'is-busy'
          }`}
        >
          <span className="status-dot" />
          {driver.available ? 'Available' : 'Busy'}
        </span>
      </div>

      <div className="driver-location">
        <span>📍</span>
        {driver.area}
      </div>

      <div className="driver-stats">
        <div>
          <span className="stat-label">Rating</span>
          <strong>★ {driver.rating.toFixed(1)}</strong>
        </div>

        <div>
          <span className="stat-label">Completed trips</span>
          <strong>{driver.trips}+</strong>
        </div>
      </div>

      <div className="driver-card-bottom">
        <div>
          <span className="stat-label">Starting from</span>
          <strong className="driver-fare">
            ₹{driver.fare.toLocaleString('en-IN')}
          </strong>
        </div>

        <button
          className="btn btn-primary book-button"
          disabled={!driver.available}
          onClick={() => onBook(driver)}
        >
          {driver.available ? 'Book now →' : 'Unavailable'}
        </button>
      </div>
    </article>
  )
}
