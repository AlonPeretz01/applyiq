import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Jobs from './pages/Jobs.jsx'
import Applications from './pages/Applications.jsx'
import CvVersions from './pages/CvVersions.jsx'
import Profile from './pages/Profile.jsx'
import Analytics from './pages/Analytics.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import OnboardingModal from './components/OnboardingModal.jsx'
import { useAuth } from './context/AuthContext.jsx'

const ONBOARDING_KEY = 'applyiq_onboarding_complete'

export default function App() {
  const { user } = useAuth()

  // Initialised once from localStorage — never flashes if already complete
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  )

  function handleOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
  }

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — all wrapped in Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/"             element={<Dashboard />}    />
          <Route path="/jobs"         element={<Jobs />}          />
          <Route path="/cv-versions"  element={<CvVersions />}   />
          <Route path="/applications" element={<Applications />}  />
          <Route path="/analytics"    element={<Analytics />}    />
          <Route path="/profile"      element={<Profile />}       />
        </Route>
      </Routes>

      {/* Onboarding — only shown to authenticated users who haven't seen it */}
      {user && showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </>
  )
}
