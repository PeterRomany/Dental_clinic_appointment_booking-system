import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AssistantView from './pages/AssistantView'
import DoctorView from './pages/DoctorView'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 font-cairo">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute allowedRoles={['assistant']}>
                <AssistantView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
