import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

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
import CreateStandPage from '@/modules/inventario/pages/CreateStandPage'
import EditStandPage from '@/modules/inventario/pages/EditStandPage'

import Dashboard from '@/modules/landing/pages/Dashboard'
import LoginPage from '@/modules/auth/pages/LoginPage'
import MaterialsPage from '@/modules/materiales/pages/MaterialsPage'
import ProfilePage from '@/modules/perfil/pages/ProfilePage'
import RecoverPasswordPage from '@/modules/auth/pages/RecoverPasswordPage'
import ReportsPage from '@/modules/reportes/pages/ReportsPage'

import type { ReactNode } from 'react'

function Private({
  children,
}: {
  children: ReactNode
}) {
  return <RequireAuth>{children}</RequireAuth>
}

function ModuleRoute({
  children,
}: {
  children: ReactNode
}) {
  return (
    <RequireAuth>
      <RequireModule>{children}</RequireModule>
    </RequireAuth>
  )
}

function AdminRoute({
  children,
}: {
  children: ReactNode
}) {
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
          {/* Rutas públicas */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/recuperar"
            element={<RecoverPasswordPage />}
          />

          {/* Inicio */}
          <Route
            path="/inicio"
            element={
              <Private>
                <HomePage />
              </Private>
            }
          />

          {/* Inventario */}
          <Route
            path="/inventario"
            element={
              <ModuleRoute>
                <InventoryPage />
              </ModuleRoute>
            }
          />

          {/* Categorías */}
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

          {/* Bodegas */}
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
            path="/inventario/bodegas/:id"
            element={
              <ModuleRoute>
                <ViewBodegaPage />
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

          {/* Crear stand */}
          <Route
            path="/inventario/bodegas/:id_bodega/stands/crear"
            element={
              <ModuleRoute>
                <CreateStandPage />
              </ModuleRoute>
            }
          />

          {/* Ver stand */}
          <Route
            path="/inventario/bodegas/:id_bodega/stands/:id_stand"
            element={
              <ModuleRoute>
                <ViewStandPage />
              </ModuleRoute>
            }
          />

          {/* Editar stand */}
          <Route
            path="/inventario/bodegas/:id_bodega/stands/:id_stand/editar"
            element={
              <ModuleRoute>
                <EditStandPage />
              </ModuleRoute>
            }
          />

          {/* Materiales */}
          <Route
            path="/materiales"
            element={
              <ModuleRoute>
                <MaterialsPage />
              </ModuleRoute>
            }
          />

          {/* Ambiental */}
          <Route
            path="/ambiental"
            element={
              <ModuleRoute>
                <EnvironmentalPage />
              </ModuleRoute>
            }
          />

          {/* Actividades */}
          <Route
            path="/actividades"
            element={
              <ModuleRoute>
                <ActivitiesPage />
              </ModuleRoute>
            }
          />

          {/* Reportes */}
          <Route
            path="/reportes"
            element={
              <ModuleRoute>
                <ReportsPage />
              </ModuleRoute>
            }
          />

          {/* Perfil */}
          <Route
            path="/perfil"
            element={
              <Private>
                <ProfilePage />
              </Private>
            }
          />

          {/* Administración */}
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

          {/* Ruta no encontrada */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App