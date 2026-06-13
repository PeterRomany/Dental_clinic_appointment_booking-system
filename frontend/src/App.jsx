import { Routes, Route, Navigate } from 'react-router-dom'
import AssistantView from './pages/AssistantView'
import DoctorView from './pages/DoctorView'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-cairo">
      <Routes>
        <Route path="/assistant" element={<AssistantView />} />
        <Route path="/doctor" element={<DoctorView />} />
        <Route path="*" element={<Navigate to="/assistant" replace />} />
      </Routes>
    </div>
  )
}
