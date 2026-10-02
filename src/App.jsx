import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSpace } from './hooks/useSpace'

import Home from './pages/Home.jsx'
import Story from './pages/Story.jsx'
import MemoryDetail from './pages/MemoryDetail.jsx'
import TimeMachine from './pages/TimeMachine.jsx'
import Places from './pages/Places.jsx'
import PhotoWall from './pages/PhotoWall.jsx'
import Capsules from './pages/Capsules.jsx'
import Wishlist from './pages/Wishlist.jsx'
import WishlistDetail from './pages/WishlistDetail.jsx'
import Numbers from './pages/Numbers.jsx'
import Search from './pages/Search.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Join from './pages/Join.jsx'
import DeleteAccount from './pages/DeleteAccount.jsx'
import AccountDeleted from './pages/AccountDeleted.jsx'

function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { space, loading: spaceLoading } = useSpace()

  if (authLoading || (user && spaceLoading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--line)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!space) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/account-deleted" element={<AccountDeleted />} />
        <Route
          path="/delete-account"
          element={
            <ProtectedRoute>
              <DeleteAccount />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/story"
          element={
            <ProtectedRoute>
              <Story />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memory/:id"
          element={
            <ProtectedRoute>
              <MemoryDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/time-machine"
          element={
            <ProtectedRoute>
              <TimeMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/places"
          element={
            <ProtectedRoute>
              <Places />
            </ProtectedRoute>
          }
        />
        <Route
          path="/photo-wall"
          element={
            <ProtectedRoute>
              <PhotoWall />
            </ProtectedRoute>
          }
        />
        <Route
          path="/capsules"
          element={
            <ProtectedRoute>
              <Capsules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist/:id"
          element={
            <ProtectedRoute>
              <WishlistDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/numbers"
          element={
            <ProtectedRoute>
              <Numbers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
