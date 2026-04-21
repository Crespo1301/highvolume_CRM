import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ColdCallCRM from './ColdCallCRM'
import LandingPage from './LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<ColdCallCRM />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
