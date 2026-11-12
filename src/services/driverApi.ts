
export type Vehicle = 'Auto' | 'Car' | 'Pickup' | 'Lorry'

export type RegisteredDriver = {
  id: string
  name: string
  phone: string
  vehicle: Vehicle
  area: string
  fare: number
  registeredAt: string
}

export type NewDriver = {
  name: string
  phone: string
  vehicle: Vehicle
  area: string
  fare: number
  password: string
}

// API configuration:
// Local development uses localhost by default.
// Production uses the Vercel environment variable.

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:5000/api'
).replace(/\/+$/, '')

const DRIVER_TOKEN_KEY = 'localride-driver-token'

type DriversResponse = {
  success: boolean
  drivers: RegisteredDriver[]
  message?: string
}

type DriverResponse = {
  success: boolean
  driver: RegisteredDriver
  message?: string
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data.message || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

function getDriverAuthHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(DRIVER_TOKEN_KEY)
      : null

  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// --------------------------------------------------
// DRIVER MANAGEMENT
// --------------------------------------------------

export async function fetchDrivers(): Promise<RegisteredDriver[]> {
  const response = await fetch(`${API_BASE_URL}/drivers`)

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: DriversResponse = await response.json()

  if (!data.success || !Array.isArray(data.drivers)) {
    throw new Error('The server returned an invalid driver list.')
  }

  return data.drivers
}

export async function registerDriver(
  driver: NewDriver,
): Promise<RegisteredDriver> {
  const response = await fetch(`${API_BASE_URL}/drivers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driver),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: DriverResponse = await response.json()

  if (!data.success || !data.driver) {
    throw new Error('The server could not register the driver.')
  }

  return data.driver
}

// --------------------------------------------------
// DRIVER LOGIN
// --------------------------------------------------

export type DriverLoginResponse = {
  token: string
  driver: RegisteredDriver
}

export async function loginDriver(
  phone: string,
  password: string,
): Promise<DriverLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, password }),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: {
    success: boolean
    token: string
    driver: RegisteredDriver
    message?: string
  } = await response.json()

  if (!data.success || !data.token || !data.driver) {
    throw new Error(data.message || 'Driver login failed.')
  }

  return {
    token: data.token,
    driver: data.driver,
  }
}

// --------------------------------------------------
// BOOKING TYPES
// --------------------------------------------------

export type NewBooking = {
  driverId: string
  customerName: string
  pickup: string
  destination: string
  distance: number
  date: string
  phone: string
}

export type SavedBooking = {
  id: string
  reference: string
  driverId: string
  driverName: string
  customerName: string
  vehicle: Vehicle
  area: string
  fare: number
  pickup: string
  destination: string
  distance: number
  date: string
  phone: string
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  createdAt: string
}

// --------------------------------------------------
// CREATE BOOKING
// --------------------------------------------------

export async function createBooking(
  booking: NewBooking,
): Promise<SavedBooking> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: {
    success: boolean
    booking: SavedBooking
    message?: string
  } = await response.json()

  if (!data.success || !data.booking) {
    throw new Error(data.message || 'Could not create booking.')
  }

  return data.booking
}

// --------------------------------------------------
// DRIVER BOOKING MANAGEMENT
// --------------------------------------------------

export async function fetchBookings(): Promise<SavedBooking[]> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    headers: getDriverAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: {
    success: boolean
    bookings: SavedBooking[]
    message?: string
  } = await response.json()

  if (!data.success || !Array.isArray(data.bookings)) {
    throw new Error(data.message || 'Could not load bookings.')
  }

  return data.bookings
}

export async function cancelSavedBooking(
  bookingId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: 'PATCH',
      headers: getDriverAuthHeaders(),
    },
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: { success: boolean; message?: string } =
    await response.json()

  if (!data.success) {
    throw new Error(data.message || 'Could not cancel booking.')
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'Confirmed' | 'Completed',
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}/status`,
    {
      method: 'PATCH',
      headers: getDriverAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ status }),
    },
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: { success: boolean; message?: string } =
    await response.json()

  if (!data.success) {
    throw new Error(data.message || 'Could not update booking status.')
  }
}

// --------------------------------------------------
// CUSTOMER BOOKING HISTORY
// --------------------------------------------------

export async function fetchCustomerBookings(
  phone: string,
): Promise<SavedBooking[]> {
  const response = await fetch(
    `${API_BASE_URL}/customer/bookings?phone=${encodeURIComponent(phone)}`,
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: {
    success: boolean
    bookings: SavedBooking[]
    message?: string
  } = await response.json()

  if (!data.success || !Array.isArray(data.bookings)) {
    throw new Error(data.message || 'Could not load customer bookings.')
  }

  return data.bookings
}

export async function cancelCustomerBooking(
  bookingId: string,
  phone: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/customer/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    },
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data: {
    success: boolean
    message?: string
  } = await response.json()

  if (!data.success) {
    throw new Error(data.message || 'Could not cancel booking.')
  }
}
