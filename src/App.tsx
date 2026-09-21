import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAdmin from './components/auth/RequireAdmin'
import RequireAuth from './components/auth/RequireAuth'
import RequireModule from './components/auth/RequireModule'
import { AuthProvider } from './lib/auth'
import ActivitiesPage from './pages/ActivitiesPage'
import Dashboard from './pages/Dashboard'
import EnvironmentalPage from './pages/EnvironmentalPage'
import HomePage from './pages/HomePage'
import InventoryPage from './pages/InventoryPage'
import LoginPage from './pages/LoginPage'
import MaterialsPage from './pages/MaterialsPage'
import ProfilePage from './pages/ProfilePage'
import RecoverPasswordPage from './pages/RecoverPasswordPage'
import ReportsPage from './pages/ReportsPage'
import RolesPage from './pages/RolesPage'
import UsersPage from './pages/UsersPage'
import type { ReactNode } from 'react'

function Private({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}

function ModuleRoute({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireModule>{children}</RequireModule>
    </RequireAuth>
  )
}

function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireAdmin>{children}</RequireAdmin>
    </RequireAuth>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar" element={<RecoverPasswordPage />} />
          <Route path="/inicio" element={<Private><HomePage /></Private>} />
          <Route path="/inventario" element={<ModuleRoute><InventoryPage /></ModuleRoute>} />
          <Route path="/materiales" element={<ModuleRoute><MaterialsPage /></ModuleRoute>} />
          <Route path="/ambiental" element={<ModuleRoute><EnvironmentalPage /></ModuleRoute>} />
          <Route path="/actividades" element={<ModuleRoute><ActivitiesPage /></ModuleRoute>} />
          <Route path="/reportes" element={<ModuleRoute><ReportsPage /></ModuleRoute>} />
          <Route path="/perfil" element={<Private><ProfilePage /></Private>} />
          <Route
            path="/usuarios"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/perfiles"
            element={
              <AdminRoute>
                <RolesPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
