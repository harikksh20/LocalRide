
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { VehicleType } from '../../data/mockDrivers'
import { calculateFare, fareRates, formatFare } from '../../utils/fareCalculator'
import '../../App.css'

type FareEstimatorProps = {
  vehicle: Exclude<VehicleType, 'All'>
}

export default function FareEstimator({ vehicle }: FareEstimatorProps) {
  const [distance, setDistance] = useState('10')

  const distanceKm = Number(distance)
  const validDistance =
    distance.trim() !== '' &&
    Number.isFinite(distanceKm) &&
    distanceKm > 0 &&
    distanceKm <= 10000

  const fare = validDistance
    ? calculateFare(vehicle, distanceKm)
    : null

  const { baseFare, ratePerKm } = fareRates[vehicle]

  function handleDistanceChange(event: ChangeEvent<HTMLInputElement>) {
    setDistance(event.target.value)
  }

  return (
    <section className="fare-estimator">
      <div className="fare-estimator-heading">
        <span className="section-kicker">FARE ESTIMATOR</span>
        <h2>Estimate your journey</h2>
        <p>Choose a distance to see the estimated fare for this vehicle.</p>
      </div>

      <label className="fare-estimator-field">
        Journey distance (km)
        <input
          type="number"
          min="0.1"
          max="10000"
          step="0.1"
          value={distance}
          onChange={handleDistanceChange}
          placeholder="Enter distance in kilometres"
        />
      </label>

      <div className="fare-estimator-breakdown">
        <div>
          <span>Vehicle</span>
          <strong>{vehicle}</strong>
        </div>
        <div>
          <span>Base fare</span>
          <strong>{formatFare(baseFare)}</strong>
        </div>
        <div>
          <span>Rate per km</span>
          <strong>{formatFare(ratePerKm)}</strong>
        </div>
      </div>

      <div className="fare-estimator-total">
        <span>Estimated fare</span>
        <strong>
          {fare === null ? 'Enter a valid distance' : formatFare(fare)}
        </strong>
      </div>

      <p className="fare-estimator-note">
        Demo estimate based on manually entered distance. Actual road distance,
        tolls, waiting charges and any additional fees are not included.
      </p>
    </section>
  )
}
