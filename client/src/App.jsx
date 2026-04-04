import { useState, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import OnboardingModal from './components/OnboardingModal.jsx'
import { useAuth } from './context/AuthContext.jsx'

const Dashboard    = lazy(() => import('./pages/Dashboard.jsx'))
const Jobs         = lazy(() => import('./pages/Jobs.jsx'))
const Applications = lazy(() => import('./pages/Applications.jsx'))
const CvVersions   = lazy(() => import('./pages/CvVersions.jsx'))
const Analytics    = lazy(() => import('./pages/Analytics.jsx'))
const Profile      = lazy(() => import('./pages/Profile.jsx'))

function PageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid var(--border-subtle)',
        borderTopColor: 'var(--accent-primary)',
        animation: 'spinRing 0.75s linear infinite',
      }} />
    </div>
  )
}

const ONBOARDING_KEY = 'hiretrack_onboarding_complete'

export default function App() {
  const { user } = useAuth()

  // Initialised once from localStorage — never flashes if already complete
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const stored = localStorage.getItem(ONBOARDING_KEY)
    console.log('[onboarding] key:', ONBOARDING_KEY, '| stored:', stored, '| showOnboarding:', !stored)
    return !stored
  })

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
          <Route path="/"             element={<Suspense fallback={<PageSpinner />}><Dashboard /></Suspense>}    />
          <Route path="/jobs"         element={<Suspense fallback={<PageSpinner />}><Jobs /></Suspense>}          />
          <Route path="/cv-versions"  element={<Suspense fallback={<PageSpinner />}><CvVersions /></Suspense>}   />
          <Route path="/applications" element={<Suspense fallback={<PageSpinner />}><Applications /></Suspense>}  />
          <Route path="/analytics"    element={<Suspense fallback={<PageSpinner />}><Analytics /></Suspense>}    />
          <Route path="/profile"      element={<Suspense fallback={<PageSpinner />}><Profile /></Suspense>}       />
        </Route>
      </Routes>

      {/* Onboarding — only shown to authenticated users who haven't seen it */}
      {user && showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </>
  )
}
