import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './account/AuthContext'
import { Layout } from './components/Layout'
import { AccountLayout } from './pages/account/AccountLayout'
import { DailyBloomsPage } from './pages/account/DailyBloomsPage'
import { MyDonationsPage } from './pages/account/MyDonationsPage'
import { MyRequestsPage } from './pages/account/MyRequestsPage'
import { SettingsPage } from './pages/account/SettingsPage'
import { CampaignDetailPage } from './pages/CampaignDetailPage'
import { ExplorePage } from './pages/ExplorePage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RequestHelpPage } from './pages/RequestHelpPage'
import { ReviewerPage } from './pages/ReviewerPage'
import { WalletProvider } from './wallet/WalletContext'

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="request" element={<RequestHelpPage />} />
              <Route path="campaign/:id" element={<CampaignDetailPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="reviewer" element={<ReviewerPage />} />
              <Route path="account" element={<AccountLayout />}>
                <Route index element={<DailyBloomsPage />} />
                <Route path="donations" element={<MyDonationsPage />} />
                <Route path="requests" element={<MyRequestsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  )
}
