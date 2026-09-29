import { useEffect, useMemo, useState } from 'react'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import {
  ErrorBanner,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { ApiError, api } from '@/shared/lib/api'
import type { RoleDetail } from '@/shared/types/profile'

const ADMIN_BODEGA_OFF = new Set(['bodega.crear', 'bodega.eliminar'])

type PermissionItem = {
  code: string
  actionLabel: string
}

type ResourceItem = {
  resource: string
  label: string
  permissions: PermissionItem[]
}

type CatalogModule = {
  name: string
  resources: ResourceItem[]
}

function describeAction(code: string, resourceLabel: string) {
  const action = code.split('.')[1] ?? ''
  const name = resourceLabel.toLowerCase()
  if (action === 'ver') return `Puede ver ${name}.`
  if (action === 'crear') return `Puede crear ${name}.`
  if (action === 'editar') return `Puede editar ${name}.`
  if (action === 'eliminar') return `Puede eliminar ${name}.`
  return resourceLabel
}

function sameModule(name: string, label: string, code: string) {
  const value = name.trim().toLowerCase()
  return value === label.trim().toLowerCase() || value === code.trim().toLowerCase()
}

export default function InventoryFunctions({
  roleId,
  moduleNodeId,
  moduleLabel,
  moduleCode,
  selectedModuleIds,
  permissionCodes,
  onSaved,
  onMatch,
}: {
  roleId: string
  moduleNodeId: number
  moduleLabel: string
  moduleCode: string
  selectedModuleIds: number[]
  permissionCodes: string[]
  onSaved: (detail: RoleDetail) => void
  onMatch: (matched: boolean) => void
}) {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [resourceKey, setResourceKey] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [matched, setMatched] = useState(false)
  const isInventario = sameModule('inventario', moduleLabel, moduleCode)

  const inventarioCodes = useMemo(
    () => new Set(resources.flatMap((resource) => resource.permissions.map((item) => item.code))),
    [resources],
  )

  const active = resources.find((item) => item.resource === resourceKey) ?? null

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const catalog = await api<{ modules: CatalogModule[] }>('/permissions')
        const moduleCatalog = catalog.modules.find((item) => sameModule(item.name, moduleLabel, moduleCode))
        if (cancelled) return
        const found = Boolean(moduleCatalog)
        setMatched(found)
        setResources(moduleCatalog?.resources ?? [])
        onMatch(found)
      } catch (caught) {
        if (!cancelled) {
          setMatched(false)
          onMatch(false)
          setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar los permisos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [moduleLabel, moduleCode, onMatch])

  useEffect(() => {
    setSelected(new Set(permissionCodes.filter((code) => inventarioCodes.has(code))))
  }, [permissionCodes, inventarioCodes])

  const toggle = (code: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const save = async (codes: Set<string>, note: string) => {
    if (!moduleNodeId) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const moduleIds = [...new Set([...selectedModuleIds, moduleNodeId])]
      await api<RoleDetail>(`/roles/${roleId}/modules`, {
        method: 'PUT',
        body: JSON.stringify({ moduleIds }),
      })

      const outside = permissionCodes.filter((code) => !inventarioCodes.has(code))
      const detail = await api<RoleDetail>(`/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionCodes: [...outside, ...codes] }),
      })
      onSaved(detail)
      setMessage(note)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron guardar los permisos.')
    } finally {
      setSaving(false)
    }
  }

  const applyAdminBodega = () => {
    const codes = new Set([...inventarioCodes].filter((code) => !ADMIN_BODEGA_OFF.has(code)))
    setSelected(codes)
    void save(codes, 'Quedó como admin de bodega. Asigna la bodega en el usuario.')
  }

  if (!loading && !matched && !error) return null

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {active ? (
          <Button type="button" variant="secondary" onClick={() => setResourceKey(null)}>
            Recursos
          </Button>
        ) : null}
        {isInventario ? (
          <Button
            type="button"
            variant="secondary"
            disabled={saving || resources.length === 0}
            onClick={applyAdminBodega}
          >
            Agregar como admin bodega
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={saving || resources.length === 0}
          onClick={() => void save(selected, 'Permisos guardados.')}
        >
          Guardar permisos
        </Button>
      </div>

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
      {message ? <p className="mb-4 text-sm text-sena">{message}</p> : null}

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando permisos…" />
        ) : !matched ? null : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                  <TableHeader width={tableColumns.name}>{active ? 'Función' : 'Recurso'}</TableHeader>
                  <TableHeader width={tableColumns.relation}>Descripción</TableHeader>
                  <TableHeader align="center" width={tableColumns.count}>
                    Funciones
                  </TableHeader>
                  <TableHeader align="center" width={tableColumns.status}>
                    Estado
                  </TableHeader>
                  <TableHeader align="center" width={tableColumns.actions}>
                    Acciones
                  </TableHeader>
                </tr>
              </thead>
              <tbody>
                {resources.length === 0 ? (
                  <TableEmpty colSpan={5}>Este módulo no tiene permisos.</TableEmpty>
                ) : active ? (
                  active.permissions.length === 0 ? (
                    <TableEmpty colSpan={5}>Este recurso no tiene permisos.</TableEmpty>
                  ) : (
                    active.permissions.map((item) => {
                      const assigned = selected.has(item.code)
                      return (
                        <TableRow key={item.code}>
                          <td className="px-5 py-4">
                            <p className="truncate font-semibold text-sena-text">{item.actionLabel}</p>
                          </td>
                          <td className="truncate px-5 py-4 font-medium text-sena-dark">
                            {describeAction(item.code, active.label)}
                          </td>
                          <td className="px-5 py-4 text-center text-sena-text/70">—</td>
                          <td className="px-5 py-4 text-center">
                            <label className="inline-flex items-center justify-center gap-2 text-sm text-sena-text">
                              <input
                                type="checkbox"
                                className="size-4 accent-[#00a651]"
                                checked={assigned}
                                onChange={() => toggle(item.code)}
                              />
                              <StatusPill tone={assigned ? 'ok' : 'warn'}>
                                {assigned ? 'Sí' : 'No'}
                              </StatusPill>
                            </label>
                          </td>
                          <td className="px-5 py-4 text-center text-sena-text/45">—</td>
                        </TableRow>
                      )
                    })
                  )
                ) : (
                  resources.map((resource) => {
                    const marked = resource.permissions.filter((item) => selected.has(item.code))
                    const assigned = marked.length > 0
                    return (
                      <TableRow key={resource.resource}>
                        <td className="px-5 py-4">
                          <p className="truncate font-semibold text-sena-text">{resource.label}</p>
                        </td>
                        <td className="truncate px-5 py-4 font-medium text-sena-dark">
                          {marked.length > 0 ? marked.map((item) => item.actionLabel).join(', ') : 'Ninguna'}
                        </td>
                        <td className="px-5 py-4 text-center text-sena-text/70">
                          {marked.length} / {resource.permissions.length}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill tone={assigned ? 'ok' : 'warn'}>{assigned ? 'Sí' : 'No'}</StatusPill>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            className="text-sm font-semibold text-sena hover:underline"
                            onClick={() => setResourceKey(resource.resource)}
                          >
                            Asignar
                          </button>
                        </td>
                      </TableRow>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  )
}
