
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import {
  ArrowRight,
  CarFront,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { auth } from '../lib/firebase'
import { loginDriver } from '../services/driverApi'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import '../App.css'

type LoginMode = 'customer' | 'driver'
type CustomerAction = 'login' | 'register'

function getFirebaseErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Something went wrong. Please try again.'
  }

  const code = (error as { code?: string }).code

  const messages: Record<string, string> = {
    'auth/email-already-in-use':
      'This email is already registered. Please sign in.',
    'auth/invalid-email':
      'Enter a valid email address.',
    'auth/invalid-credential':
      'Incorrect email or password.',
    'auth/user-not-found':
      'No account found with this email. Please register.',
    'auth/wrong-password':
      'Incorrect email or password.',
    'auth/weak-password':
      'Your password must contain at least 6 characters.',
    'auth/too-many-requests':
      'Too many attempts. Please try again later.',
    'auth/network-request-failed':
      'Network error. Check your internet connection.',
    'auth/operation-not-allowed':
      'Email/password login is not enabled in Firebase Console.',
  }

  return messages[code ?? ''] ?? error.message
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useCustomerAuth()

  const [mode, setMode] = useState<LoginMode>('customer')
  const [customerAction, setCustomerAction] =
    useState<CustomerAction>('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user && mode === 'customer') {
      navigate('/customer/dashboard', { replace: true })
    }
  }, [user, mode, navigate])

  function resetMessages() {
    setError('')
    setMessage('')
  }

  function changeMode(nextMode: LoginMode) {
    setMode(nextMode)
    setCustomerAction('login')
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    resetMessages()
  }

  function changeCustomerAction(nextAction: CustomerAction) {
    setCustomerAction(nextAction)
    setPassword('')
    setConfirmPassword('')
    resetMessages()
  }

  async function handleCustomerSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    resetMessages()

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setError('Enter your email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    if (customerAction === 'register') {
      if (name.trim().length < 2) {
        setError('Enter your full name.')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)

    try {
      if (customerAction === 'register') {
        const credential = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password,
        )

        await updateProfile(credential.user, {
          displayName: name.trim(),
        })

        setMessage('Account created successfully. Welcome to LocalRide!')

        navigate('/customer/dashboard', { replace: true })
      } else {
        await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          password,
        )

        navigate('/customer/dashboard', { replace: true })
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDriverLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    resetMessages()
    setLoading(true)

    try {
      const digits = phone.replace(/\D/g, '')

      if (!/^[6-9]\d{9}$/.test(digits)) {
        throw new Error(
          'Enter a valid 10-digit Indian mobile number.',
        )
      }

      if (!password.trim()) {
        throw new Error('Enter your driver password.')
      }

      const result = await loginDriver(digits, password)

      sessionStorage.setItem(
        'localride-driver-token',
        result.token,
      )

      sessionStorage.setItem(
        'localride-authenticated-driver',
        JSON.stringify(result.driver),
      )

      navigate('/driver/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Driver login failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="lr-auth-page">
      <section className="lr-auth-visual">
        <div className="lr-auth-visual-content">
          <Link to="/" className="lr-auth-brand">
            <span className="lr-auth-brand-mark">L</span>
            <span>
              Local<span>Ride</span>
            </span>
          </Link>

          <div className="lr-auth-story">
            <span className="lr-auth-eyebrow">
              YOUR JOURNEY, OUR PRIORITY
            </span>

            <h1>
              Every journey
              <br />
              begins with
              <br />
              <span>confidence.</span>
            </h1>

            <p>
              Find trusted local drivers and make every trip
              comfortable, simple and reliable.
            </p>

            <div className="lr-auth-benefits">
              <span>
                <ShieldCheck size={17} />
                Trusted local drivers
              </span>

              <span>
                <CarFront size={17} />
                Convenient journeys
              </span>
            </div>
          </div>

          <div className="lr-auth-visual-footer">
            LOCALRIDE · CONNECTING EVERY JOURNEY
          </div>
        </div>
      </section>

      <section className="lr-auth-panel">
        <div className="lr-auth-card">
          <div className="lr-auth-mobile-brand">
            <span className="lr-auth-brand-mark">L</span>
            <strong>LocalRide</strong>
          </div>

          <span className="lr-auth-eyebrow lr-auth-eyebrow-dark">
            WELCOME TO LOCALRIDE
          </span>

          <h2>
            {mode === 'customer'
              ? customerAction === 'login'
                ? 'Sign in to continue'
                : 'Create your account'
              : 'Driver sign in'}
          </h2>

          <p className="lr-auth-subtitle">
            {mode === 'customer'
              ? 'Access your LocalRide account securely.'
              : 'Manage your rides and booking requests.'}
          </p>

          <div className="lr-auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'customer'}
              className={mode === 'customer' ? 'active' : ''}
              onClick={() => changeMode('customer')}
            >
              <UserRound size={17} />
              Customer
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'driver'}
              className={mode === 'driver' ? 'active' : ''}
              onClick={() => changeMode('driver')}
            >
              <CarFront size={17} />
              Driver
            </button>
          </div>

          {mode === 'customer' ? (
            <>
              <div className="lr-auth-switch">
                <button
                  type="button"
                  className={
                    customerAction === 'login' ? 'active' : ''
                  }
                  onClick={() => changeCustomerAction('login')}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  className={
                    customerAction === 'register' ? 'active' : ''
                  }
                  onClick={() => changeCustomerAction('register')}
                >
                  Create account
                </button>
              </div>

              <form
                className="lr-auth-form"
                onSubmit={handleCustomerSubmit}
              >
                {customerAction === 'register' && (
                  <>
                    <label htmlFor="customer-name">
                      Full name
                    </label>

                    <input
                      id="customer-name"
                      className="lr-auth-input"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      minLength={2}
                      required
                    />
                  </>
                )}

                <label htmlFor="customer-email">
                  Email address
                </label>

                <input
                  id="customer-email"
                  className="lr-auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

                <label htmlFor="customer-password">
                  Password
                </label>

                <input
                  id="customer-password"
                  className="lr-auth-input"
                  type="password"
                  autoComplete={
                    customerAction === 'register'
                      ? 'new-password'
                      : 'current-password'
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={6}
                  required
                />

                {customerAction === 'register' && (
                  <>
                    <label htmlFor="customer-confirm-password">
                      Confirm password
                    </label>

                    <input
                      id="customer-confirm-password"
                      className="lr-auth-input"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      minLength={6}
                      required
                    />
                  </>
                )}

                {error && (
                  <p className="lr-auth-error" role="alert">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="lr-auth-success" role="status">
                    {message}
                  </p>
                )}

                <button
                  className="lr-auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Please wait...'
                    : customerAction === 'login'
                      ? 'Sign in to LocalRide'
                      : 'Create account'}
                  {!loading && <ArrowRight size={18} />}
                </button>

                <p className="lr-auth-note">
                  Your account is protected by Firebase Authentication.
                </p>
              </form>
            </>
          ) : (
            <form
              className="lr-auth-form"
              onSubmit={handleDriverLogin}
            >
              <label htmlFor="driver-phone">
                Mobile number
              </label>

              <div className="lr-auth-phone-field">
                <span>+91</span>

                <input
                  id="driver-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10),
                    )
                  }
                  required
                />
              </div>

              <label htmlFor="driver-password">
                Password
              </label>

              <input
                id="driver-password"
                className="lr-auth-input"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

              {error && (
                <p className="lr-auth-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="lr-auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in as driver'}
                {!loading && <ArrowRight size={18} />}
              </button>

              <p className="lr-auth-register">
                New to LocalRide?{' '}
                <Link to="/driver/register">
                  Register as a driver
                </Link>
              </p>
            </form>
          )}

          <div className="lr-auth-divider">
            <span>SECURE ACCESS</span>
          </div>

          <p className="lr-auth-legal">
            By continuing, you agree to LocalRide’s terms and privacy
            policy.
          </p>
        </div>
      </section>
    </main>
  )
}
