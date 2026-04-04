import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useUser } from './contexts/UserContext'

// Pages
import Dashboard from './pages/Dashboard'
import WorkoutLogger from './pages/WorkoutLogger'
import Suggestions from './pages/Suggestions'
import ProfileSetup from './pages/ProfileSetup'
import Login from './pages/Login'
import History from './pages/History'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'

export default function App() {
  const { currentUser } = useAuth();
  const { userData, loading: userLoading } = useUser();

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-primary/20 rounded-full border-t-2 border-primary animate-spin" />
          <p className="font-label text-[10px] uppercase tracking-widest text-surface-variant">
            Kinetic Link Established...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />

      {/* Auth-Required Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {userData?.profileComplete ? <Dashboard /> : <Navigate to="/onboarding" />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workout"
        element={
          <ProtectedRoute>
            <WorkoutLogger />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />

      <Route
        path="/suggestions"
        element={
          <ProtectedRoute>
            <Suggestions />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}