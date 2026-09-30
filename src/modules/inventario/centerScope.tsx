import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/context/auth'
import AppLayout from '@/shared/components/layout/AppLayout'
import { ApiError, api } from '@/shared/lib/api'
import type { UserFormOptions } from '@/shared/types/profile'

type CenterOption = UserFormOptions['centers'][number]

type InventoryCenterValue = {
  isAdmin: boolean
  loadingCenters: boolean
  centersError: string | null
  regionales: string[]
  regional: string
  centerId: number | null
  centerName: string
  centersOfRegional: CenterOption[]
  setRegional: (value: string) => void
  setCenterId: (id: number) => void
  clear: () => void
}

const InventoryCenterContext = createContext<InventoryCenterValue | null>(null)

function storageKey(userId: number) {
  return `sena.inventario.centro.${userId}`
}

function regionalLabel(center: CenterOption) {
  return center.regional.trim() || 'Sin regional'
}

function readStored(userId: number) {
  try {
    const raw = sessionStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { regional?: string; centerId?: number }
    if (!parsed.regional || !parsed.centerId) return null
    return { regional: parsed.regional, centerId: parsed.centerId }
  } catch {
    return null
  }
}

export function useInventoryCenter() {
  const value = useContext(InventoryCenterContext)
  if (!value) {
    throw new Error('useInventoryCenter debe usarse dentro del inventario')
  }
  return value
}

export function useInventoryCenterOptional() {
  return useContext(InventoryCenterContext)
}

export function InventoryCenterLayout() {
  const { isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id ?? 0
  const stored = isAdmin && userId ? readStored(userId) : null

  const [centers, setCenters] = useState<CenterOption[]>([])
  const [loadingCenters, setLoadingCenters] = useState(isAdmin)
  const [centersError, setCentersError] = useState<string | null>(null)
  const [regional, setRegionalState] = useState(stored?.regional ?? '')
  const [centerId, setCenterIdState] = useState<number | null>(stored?.centerId ?? null)

  useEffect(() => {
    if (!isAdmin) return

    let cancelled = false

    api<UserFormOptions>('/users/options')
      .then((options) => {
        if (!cancelled) setCenters(options.centers)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setCentersError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar las regionales y los centros.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCenters(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin || !userId) return
    if (regional && centerId) {
      sessionStorage.setItem(storageKey(userId), JSON.stringify({ regional, centerId }))
      return
    }
    sessionStorage.removeItem(storageKey(userId))
  }, [centerId, isAdmin, regional, userId])

  useEffect(() => {
    if (!centers.length || !centerId) return
    const center = centers.find((item) => item.id === centerId)
    if (!center || regionalLabel(center) !== regional) setCenterIdState(null)
  }, [centerId, centers, regional])

  const regionales = useMemo(() => {
    const names = new Set(centers.map((center) => regionalLabel(center)))
    return [...names].sort((left, right) => left.localeCompare(right, 'es'))
  }, [centers])

  const centersOfRegional = useMemo(() => {
    if (!regional) return []
    return centers
      .filter((center) => regionalLabel(center) === regional)
      .sort((left, right) => left.name.localeCompare(right.name, 'es'))
  }, [centers, regional])

  const centerName = centers.find((center) => center.id === centerId)?.name ?? ''

  const value = useMemo<InventoryCenterValue>(
    () => ({
      isAdmin,
      loadingCenters,
      centersError,
      regionales,
      regional,
      centerId,
      centerName,
      centersOfRegional,
      setRegional: (next) => {
        setRegionalState(next)
        setCenterIdState(null)
      },
      setCenterId: (id) => setCenterIdState(id),
      clear: () => {
        setRegionalState('')
        setCenterIdState(null)
        if (userId) sessionStorage.removeItem(storageKey(userId))
        navigate('/inventario')
      },
    }),
    [
      centerId,
      centerName,
      centersError,
      centersOfRegional,
      isAdmin,
      loadingCenters,
      navigate,
      regional,
      regionales,
      userId,
    ],
  )

  return (
    <InventoryCenterContext.Provider value={value}>
      {isAdmin && !centerId ? <CenterPicker /> : <Outlet />}
    </InventoryCenterContext.Provider>
  )
}

function CenterPicker() {
  const {
    loadingCenters,
    centersError,
    regionales,
    regional,
    centersOfRegional,
    setRegional,
    setCenterId,
  } = useInventoryCenter()

  return (
    <AppLayout title="Inventario">
      <p className="text-sm font-medium text-sena">Inventario</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-sena-text">
        Selecciona la regional y el centro
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-sena-text/60">
        El inventario se muestra por centro de formación. Primero elige la regional y después el
        centro. Al seleccionarlo verás las bodegas, categorías, ítems y elementos de ese centro.
      </p>

      <form
        className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sena-dark/8"
        onSubmit={(event) => event.preventDefault()}
      >
        {centersError ? (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{centersError}</p>
        ) : null}

        <label className="flex flex-col gap-1.5" htmlFor="inventario-regional">
          <span className="text-sm font-medium text-sena-text/75">1. Regional</span>
          <select
            id="inventario-regional"
            value={regional}
            disabled={loadingCenters}
            onChange={(event) => setRegional(event.target.value)}
            className="h-11 w-full rounded-xl border border-sena-dark/10 bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20 disabled:cursor-not-allowed disabled:bg-sena-muted"
          >
            <option value="">
              {loadingCenters ? 'Cargando regionales…' : 'Selecciona una regional'}
            </option>
            {regionales.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-5 flex flex-col gap-1.5" htmlFor="inventario-centro">
          <span className="text-sm font-medium text-sena-text/75">2. Centro de formación</span>
          <select
            id="inventario-centro"
            value=""
            disabled={!regional || loadingCenters}
            onChange={(event) => {
              const id = Number(event.target.value)
              if (id) setCenterId(id)
            }}
            className="h-11 w-full rounded-xl border border-sena-dark/10 bg-white px-3 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20 disabled:cursor-not-allowed disabled:bg-sena-muted"
          >
            <option value="">
              {regional ? 'Selecciona un centro' : 'Primero elige la regional'}
            </option>
            {centersOfRegional.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </label>

        {regional && centersOfRegional.length === 0 && !loadingCenters ? (
          <p className="mt-4 text-sm text-sena-text/60">Esta regional no tiene centros de formación.</p>
        ) : (
          <p className="mt-4 text-sm text-sena-text/55">
            El centro se habilita cuando ya hay una regional elegida.
          </p>
        )}
      </form>
    </AppLayout>
  )
}

export default InventoryCenterLayout
