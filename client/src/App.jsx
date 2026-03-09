import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Jobs from './pages/Jobs.jsx'
import Applications from './pages/Applications.jsx'
import CvVersions from './pages/CvVersions.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"              element={<Dashboard />}   />
        <Route path="/jobs"          element={<Jobs />}         />
        <Route path="/cv-versions"   element={<CvVersions />}  />
        <Route path="/applications"  element={<Applications />} />
      </Route>
    </Routes>
  )
}
