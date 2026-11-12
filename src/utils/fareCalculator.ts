
import type { VehicleType } from '../data/mockDrivers'

export type FareRate = {
  baseFare: number
  ratePerKm: number
}

export const fareRates: Record<Exclude<VehicleType, 'All'>, FareRate> = {
  Auto: {
    baseFare: 30,
    ratePerKm: 15,
  },
  Car: {
    baseFare: 80,
    ratePerKm: 20,
  },
  Pickup: {
    baseFare: 150,
    ratePerKm: 25,
  },
  Lorry: {
    baseFare: 300,
    ratePerKm: 40,
  },
}

export function calculateFare(
  vehicle: Exclude<VehicleType, 'All'>,
  distanceKm: number,
): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return 0
  }

  const { baseFare, ratePerKm } = fareRates[vehicle]

  return Math.round(baseFare + distanceKm * ratePerKm)
}

export function formatFare(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
