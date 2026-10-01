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
import RoleModuleCreatePage from '@/modules/administracion/pages/RoleModuleCreatePage'
import RoleModulesPage from '@/modules/administracion/pages/RoleModulesPage'
import RolesPage from '@/modules/administracion/pages/RolesPage'
import UsersPage from '@/modules/administracion/pages/UsersPage'
import EnvironmentalPage from '@/modules/ambiental/pages/EnvironmentalPage'

import HomePage from '@/modules/inicio/pages/HomePage'
import AlertsPage from '@/modules/alertas/pages/AlertsPage'

import InventoryCenterLayout from '@/modules/inventario/centerScope'
import InventoryPage from '@/modules/inventario/pages/InventoryPage'
import InventoryCategoriesPage from '@/modules/inventario/pages/InventoryCategoriesPage'
import CreateInventoryCategoryPage from '@/modules/inventario/pages/CreateInventoryCategoryPage'
import ViewInventoryCategoryPage from '@/modules/inventario/pages/ViewInventoryCategoryPage'
import EditInventoryCategoryPage from '@/modules/inventario/pages/EditInventoryCategoryPage'

import BodegasPage from '@/modules/inventario/pages/BodegaPage'
import CreateBodegaPage from '@/modules/inventario/pages/CreateBodegaPage'
import EditBodegaPage from '@/modules/inventario/pages/EditBodegaPage'
import ViewBodegaPage from '@/modules/inventario/pages/ViewBodegaPage'
import ViewSubBodegaPage from '@/modules/inventario/pages/ViewSubBodegaPage'

import StandsPage from '@/modules/inventario/pages/StandsPage'
import ViewStandPage from '@/modules/inventario/pages/ViewStandPage'
import CreateStandPage from '@/modules/inventario/pages/CreateStandPage'
import EditStandPage from '@/modules/inventario/pages/EditStandPage'

import ItemsPage from '@/modules/inventario/pages/ItemsPage'
import ViewItemPage from '@/modules/inventario/pages/ViewItemPage'
import ElementosPage from '@/modules/inventario/pages/ElementosPage'
import ViewElementoPage from '@/modules/inventario/pages/ViewElementoPage'
import CatalogoCentroPage from '@/modules/inventario/pages/CatalogoCentroPage'

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

          {/* =========================
              RUTAS PÚBLICAS
          ========================== */}

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

          {/* =========================
              INICIO
          ========================== */}

          <Route
            path="/inicio"
            element={
              <Private>
                <HomePage />
              </Private>
            }
          />

          <Route
            path="/alertas"
            element={
              <Private>
                <AlertsPage />
              </Private>
            }
          />

          <Route
            path="/inventario"
            element={
              <ModuleRoute>
                <InventoryCenterLayout />
              </ModuleRoute>
            }
          >
            <Route index element={<InventoryPage />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="items/:id" element={<ViewItemPage />} />
            <Route path="elementos" element={<ElementosPage />} />
            <Route path="elementos/:id" element={<ViewElementoPage />} />
            <Route path="clasificaciones" element={<CatalogoCentroPage kind="clasificacion" />} />
            <Route path="unidades" element={<CatalogoCentroPage kind="unidad" />} />
            <Route path="usos-presupuestales" element={<CatalogoCentroPage kind="uso" />} />
            <Route path="codigos-estandar" element={<CatalogoCentroPage kind="codigo" />} />
            <Route path="categorias" element={<InventoryCategoriesPage />} />
            <Route path="categorias/crear" element={<CreateInventoryCategoryPage />} />
            <Route path="categorias/:id" element={<ViewInventoryCategoryPage />} />
            <Route path="categorias/:id/editar" element={<EditInventoryCategoryPage />} />
            <Route path="bodegas" element={<BodegasPage />} />
            <Route path="bodegas/crear" element={<CreateBodegaPage />} />
            <Route path="bodegas/:id/sub-bodegas/:subBodegaId" element={<ViewSubBodegaPage />} />
            <Route path="bodegas/:id_bodega/stands/crear" element={<CreateStandPage />} />
            <Route path="bodegas/:id_bodega/stands/:id_stand/editar" element={<EditStandPage />} />
            <Route path="bodegas/:id_bodega/stands/:id_stand" element={<ViewStandPage />} />
            <Route path="bodegas/:id/editar" element={<EditBodegaPage />} />
            <Route path="bodegas/:id" element={<ViewBodegaPage />} />
            <Route path="stands" element={<StandsPage />} />
            <Route path="stands/:id/editar" element={<EditStandPage />} />
            <Route path="stands/:id" element={<ViewStandPage />} />
          </Route>

          {/* =========================
              MATERIALES
          ========================== */}

          <Route
            path="/materiales"
            element={
              <ModuleRoute>
                <MaterialsPage />
              </ModuleRoute>
            }
          />

          {/* =========================
              AMBIENTAL
          ========================== */}

          <Route
            path="/ambiental"
            element={
              <ModuleRoute>
                <EnvironmentalPage />
              </ModuleRoute>
            }
          />

          {/* =========================
              ACTIVIDADES
          ========================== */}

          <Route
            path="/actividades"
            element={
              <ModuleRoute>
                <ActivitiesPage />
              </ModuleRoute>
            }
          />

          {/* =========================
              REPORTES
          ========================== */}

          <Route
            path="/reportes"
            element={
              <ModuleRoute>
                <ReportsPage />
              </ModuleRoute>
            }
          />

          {/* =========================
              PERFIL
          ========================== */}

          <Route
            path="/perfil"
            element={
              <Private>
                <ProfilePage />
              </Private>
            }
          />

          {/* =========================
              ADMINISTRACIÓN
          ========================== */}

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

          <Route
            path="/perfiles/:id/modulos"
            element={
              <AdminRoute>
                <RoleModulesPage />
              </AdminRoute>
            }
          />

          <Route
            path="/perfiles/:id/modulos/nuevo"
            element={
              <AdminRoute>
                <RoleModuleCreatePage />
              </AdminRoute>
            }
          />

          <Route
            path="/perfiles/:id/modulos/:moduleId"
            element={
              <AdminRoute>
                <RoleModulesPage />
              </AdminRoute>
            }
          />

          {/* =========================
              RUTA NO ENCONTRADA
          ========================== */}

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