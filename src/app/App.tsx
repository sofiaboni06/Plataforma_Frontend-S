import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAdmin from '@/modules/auth/guards/RequireAdmin'
import RequireAuth from '@/modules/auth/guards/RequireAuth'
import RequireModule from '@/modules/auth/guards/RequireModule'
import { AuthProvider } from '@/modules/auth/context/auth'

import ActivitiesPage from '@/modules/actividades/pages/ActivitiesPage'
import RolesPage from '@/modules/administracion/pages/RolesPage'
import UsersPage from '@/modules/administracion/pages/UsersPage'
import EnvironmentalPage from '@/modules/ambiental/pages/EnvironmentalPage'
import HomePage from '@/modules/inicio/pages/HomePage'

import InventoryPage from '@/modules/inventario/pages/InventoryPage'
import InventoryCategoriesPage from '@/modules/inventario/pages/InventoryCategoriesPage'
import CreateInventoryCategoryPage from '@/modules/inventario/pages/CreateInventoryCategoryPage'
import ViewInventoryCategoryPage from '@/modules/inventario/pages/ViewInventoryCategoryPage'
import EditInventoryCategoryPage from '@/modules/inventario/pages/EditInventoryCategoryPage'
import BodegasPage from '@/modules/inventario/pages/BodegaPage'
import CreateBodegaPage from '@/modules/inventario/pages/CreateBodegaPage'
import EditBodegaPage from '@/modules/inventario/pages/EditBodegaPage'
import ViewBodegaPage from '@/modules/inventario/pages/ViewBodegaPage'
import ViewStandPage from '@/modules/inventario/pages/ViewStandPage'

import Dashboard from '@/modules/landing/pages/Dashboard'
import LoginPage from '@/modules/auth/pages/LoginPage'
import MaterialsPage from '@/modules/materiales/pages/MaterialsPage'
import ProfilePage from '@/modules/perfil/pages/ProfilePage'
import RecoverPasswordPage from '@/modules/auth/pages/RecoverPasswordPage'
import ReportsPage from '@/modules/reportes/pages/ReportsPage'
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
          <Route
            path="/inventario/categorias"
            element={
              <ModuleRoute>
                <InventoryCategoriesPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/categorias/crear"
            element={
              <ModuleRoute>
                <CreateInventoryCategoryPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/categorias/:id"
            element={
              <ModuleRoute>
                <ViewInventoryCategoryPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/categorias/:id/editar"
            element={
              <ModuleRoute>
                <EditInventoryCategoryPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/bodegas"
            element={
              <ModuleRoute>
                <BodegasPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/bodegas/crear"
            element={
              <ModuleRoute>
                <CreateBodegaPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/bodegas/:id/editar"
            element={
              <ModuleRoute>
                <EditBodegaPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/bodegas/:bodegaId/stands/:standId"
            element={
              <ModuleRoute>
                <ViewStandPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/inventario/bodegas/:id"
            element={
              <ModuleRoute>
                <ViewBodegaPage />
              </ModuleRoute>
            }
          />

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
