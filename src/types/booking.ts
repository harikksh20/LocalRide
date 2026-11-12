
import type { VehicleType } from '../data/mockDrivers'

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'

export type Booking = {
  id: string
  reference: string
  driverId: number
  driverName: string
  vehicle: Exclude<VehicleType, 'All'>
  area: string
  fare: number
  pickup: string
  destination: string
  date: string
  phone: string
  status: BookingStatus
  createdAt: string
}
