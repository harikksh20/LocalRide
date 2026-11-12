
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface CustomerAuthContextValue {
  user: User | null
  loading: boolean
  signOutCustomer: () => Promise<void>
}

const CustomerAuthContext =
  createContext<CustomerAuthContextValue | undefined>(undefined)

interface CustomerAuthProviderProps {
  children: ReactNode
}

export function CustomerAuthProvider({
  children,
}: CustomerAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signOutCustomer: () => signOut(auth),
    }),
    [user, loading],
  )

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)

  if (!context) {
    throw new Error(
      'useCustomerAuth must be used inside CustomerAuthProvider',
    )
  }

  return context
}
