import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { RouteProvider } from '@ui/providers/router-provider'
import { ThemeProvider } from '@ui/providers/theme-provider'
import GeneratorPage from './pages/GeneratorPage'
import DashboardPage from './dashboard/DashboardPage'
import { MOCK_CAMPAIGNS } from './dashboard/mock'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <RouteProvider>
          <Routes>
            <Route path="/" element={<GeneratorPage />} />
            <Route
              path="/dashboard"
              element={
                <Navigate
                  to={`/dashboard/campaign/${MOCK_CAMPAIGNS[0]?.id ?? 'camp-1'}`}
                  replace
                />
              }
            />
            <Route path="/dashboard/campaign/:campaignId" element={<DashboardPage />} />
          </Routes>
        </RouteProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
