
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import {
  fetchDrivers,
  registerDriver,
} from '../services/driverApi'

import type {
  NewDriver,
  RegisteredDriver,
} from '../services/driverApi'

type DriverContextType = {
  drivers: RegisteredDriver[]
  loading: boolean
  error: string
  refreshDrivers: () => Promise<void>
  addDriver: (driver: NewDriver) => Promise<RegisteredDriver>
}

const DriverContext = createContext<DriverContextType | undefined>(
  undefined,
)

export function DriverProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<RegisteredDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshDrivers = useCallback(async () => {
    try {
      const savedDrivers = await fetchDrivers()
      setDrivers(savedDrivers)
      setError('')
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not load drivers.'

      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadDrivers = async () => {
      try {
        const savedDrivers = await fetchDrivers()

        if (!cancelled) {
          setDrivers(savedDrivers)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load drivers.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDrivers()

    return () => {
      cancelled = true
    }
  }, [])

  const addDriver = useCallback(
    async (driver: NewDriver) => {
      const savedDriver = await registerDriver(driver)

      setDrivers((current) => {
        const withoutDuplicate = current.filter(
          (item) => item.id !== savedDriver.id,
        )

        return [savedDriver, ...withoutDuplicate]
      })

      setError('')
      return savedDriver
    },
    [],
  )

  return (
    <DriverContext.Provider
      value={{
        drivers,
        loading,
        error,
        refreshDrivers,
        addDriver,
      }}
    >
      {children}
    </DriverContext.Provider>
  )
}

export function useDriverContext() {
  const context = useContext(DriverContext)

  if (!context) {
    throw new Error(
      'useDriverContext must be used inside DriverProvider',
    )
  }

  return context
}
