import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Jobs from './pages/Jobs.jsx'
import Applications from './pages/Applications.jsx'
import CvVersions from './pages/CvVersions.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected — all wrapped in Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/"              element={<Dashboard />}   />
        <Route path="/jobs"          element={<Jobs />}         />
        <Route path="/cv-versions"   element={<CvVersions />}  />
        <Route path="/applications"  element={<Applications />} />
        <Route path="/profile"       element={<Profile />}      />
      </Route>
    </Routes>
  )
}
