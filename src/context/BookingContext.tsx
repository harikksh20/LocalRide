
import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Booking, BookingStatus } from '../types/booking'
import { mockBookings } from '../data/mockBookings'

const STORAGE_KEY = 'localride-bookings'

type BookingContextType = {
  bookings: Booking[]
  addBooking: (booking: Booking) => void
  cancelBooking: (id: string) => void
  confirmBooking: (id: string) => void
  completeBooking: (id: string) => void
}

export const BookingContext = createContext<
  BookingContextType | undefined
>(undefined)

type BookingProviderProps = {
  children: ReactNode
}

export function BookingProvider({
  children,
}: BookingProviderProps) {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        return Array.isArray(parsed)
          ? (parsed as Booking[])
          : mockBookings
      }
    } catch {
      // Fall back to demo bookings if saved data cannot be read.
    }

    return mockBookings
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    } catch {
      // Keep the app usable for the current session if storage fails.
    }
  }, [bookings])

  const addBooking = useCallback((booking: Booking) => {
  setBookings((current) => {
    if (current.some((item) => item.id === booking.id)) {
      return current
    }

    return [booking, ...current]
  })
}, [])
  const updateStatus = useCallback(
    (id: string, allowedStatus: BookingStatus, newStatus: BookingStatus) => {
      setBookings((current) =>
        current.map((booking) =>
          booking.id === id && booking.status === allowedStatus
            ? { ...booking, status: newStatus }
            : booking,
        ),
      )
    },
    [],
  )

  const cancelBooking = useCallback((id: string) => {
    updateStatus(id, 'Pending', 'Cancelled')
  }, [updateStatus])

  const confirmBooking = useCallback((id: string) => {
    updateStatus(id, 'Pending', 'Confirmed')
  }, [updateStatus])

  const completeBooking = useCallback((id: string) => {
    updateStatus(id, 'Confirmed', 'Completed')
  }, [updateStatus])

  return (
    <BookingContext.Provider
      value={{
        bookings,
        addBooking,
        cancelBooking,
        confirmBooking,
        completeBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}
