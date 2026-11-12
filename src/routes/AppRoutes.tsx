
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import DriverDashboard from '../pages/DriverDashboardPage'
import HomePage from '../pages/HomePage'
import SearchDriversPage from '../pages/SearchDriversPage'
import DriverRegistrationPage from '../pages/DriverRegistrationPage'
import DriverLoginPage from '../pages/DriverLoginPage'
import LoginPage from '../pages/LoginPage'
import DriverDetailsPage from '../pages/DriverDetailsPage'
import BookingPage from '../pages/BookingPage'
import MyBookingsPage from '../pages/MyBookingsPage'
import NotFoundPage from '../pages/NotFoundPage'

import { BookingProvider } from '../context/BookingContext'
import { DriverProvider } from '../context/DriverContext'
import { CustomerAuthProvider, useCustomerAuth } from '../context/CustomerAuthContext'

import type { ReactNode } from 'react'

function CustomerProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useCustomerAuth()

  if (loading) {
    return <div className="auth-loading">Checking your account...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function DriverProtectedRoute({ children }: { children: ReactNode }) {
  const token = sessionStorage.getItem('localride-driver-token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRouteContent() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<LoginPage />} />

      {/* Public pages */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/drivers" element={<SearchDriversPage />} />

      <Route
        path="/driver/register"
        element={<DriverRegistrationPage />}
      />

      {/* Existing standalone driver login */}
      <Route
        path="/driver/login"
        element={<DriverLoginPage />}
      />

      <Route
        path="/driver/:driverId"
        element={<DriverDetailsPage />}
      />

      {/* Customer protected pages */}
      <Route
        path="/customer/dashboard"
        element={
          <CustomerProtectedRoute>
            <HomePage />
          </CustomerProtectedRoute>
        }
      />

      <Route
        path="/booking/:driverId"
        element={
          <CustomerProtectedRoute>
            <BookingPage />
          </CustomerProtectedRoute>
        }
      />

      <Route
        path="/my-bookings"
        element={
          <CustomerProtectedRoute>
            <MyBookingsPage />
          </CustomerProtectedRoute>
        }
      />

      {/* Driver protected pages */}
      <Route
        path="/driver/dashboard"
        element={
          <DriverProtectedRoute>
            <DriverDashboard />
          </DriverProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <CustomerAuthProvider>
        <BookingProvider>
          <DriverProvider>
            <AppRouteContent />
          </DriverProvider>
        </BookingProvider>
      </CustomerAuthProvider>
    </BrowserRouter>
  )
}
