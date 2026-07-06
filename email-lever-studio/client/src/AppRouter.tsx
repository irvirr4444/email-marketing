import { BrowserRouter, Route, Routes } from 'react-router'
import { RouteProvider } from '@ui/providers/router-provider'
import { ThemeProvider } from '@ui/providers/theme-provider'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import GeneratorPage from './pages/GeneratorPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './dashboard/DashboardPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <RouteProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<GeneratorPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/campaign/:campaignId"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </RouteProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
