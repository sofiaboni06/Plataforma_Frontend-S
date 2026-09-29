import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import { PlusIcon } from '@/shared/components/icons/AppIcons'
import {
  ErrorBanner,
  PageHeader,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { ApiError, api } from '@/shared/lib/api'
import type { ModuleNode, RoleDetail } from '@/shared/types/profile'

function collectGranted(nodes: ModuleNode[], selected: Set<number>) {
  for (const node of nodes) {
    if (node.granted) selected.add(node.id)
    collectGranted(node.children, selected)
  }
  return selected
}

function findNode(nodes: ModuleNode[], id: number): ModuleNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = findNode(node.children, id)
    if (child) return child
  }
  return null
}

function findParentId(
  nodes: ModuleNode[],
  targetId: number,
  parentId: number | null = null,
): number | null | undefined {
  for (const node of nodes) {
    if (node.id === targetId) return parentId
    const found = findParentId(node.children, targetId, node.id)
    if (found !== undefined) return found
  }
  return undefined
}

export default function RoleModulesPage() {
  const navigate = useNavigate()
  const { id, moduleId } = useParams()
  const [detail, setDetail] = useState<RoleDetail | null>(null)
  const [selectedModules, setSelectedModules] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const current = detail && moduleId ? findNode(detail.tree, Number(moduleId)) : null
  const modules = moduleId ? (current?.children ?? []) : (detail?.tree ?? [])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Módulos | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) return
      try {
        const next = await api<RoleDetail>(`/roles/${id}`)
        if (cancelled) return
        setDetail(next)
        setSelectedModules(collectGranted(next.tree, new Set()))
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : 'No se pudo abrir el perfil.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleToggle = (moduleNodeId: number) => {
    setSelectedModules((currentSelection) => {
      const next = new Set(currentSelection)
      if (next.has(moduleNodeId)) next.delete(moduleNodeId)
      else next.add(moduleNodeId)
      return next
    })
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const next = await api<RoleDetail>(`/roles/${id}/modules`, {
        method: 'PUT',
        body: JSON.stringify({ moduleIds: [...selectedModules] }),
      })
      setDetail(next)
      setSelectedModules(collectGranted(next.tree, new Set()))
      setMessage('Módulos guardados. Marcar uno no concede los que tiene adentro.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron guardar los módulos.')
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => {
    if (!id) return
    if (!moduleId || !detail) {
      navigate('/perfiles')
      return
    }
    const parentId = findParentId(detail.tree, Number(moduleId))
    if (typeof parentId === 'number') navigate(`/perfiles/${id}/modulos/${parentId}`)
    else navigate(`/perfiles/${id}/modulos`)
  }

  const openCreate = () => {
    if (!id) return
    const parent = moduleId ? `?padre=${moduleId}` : ''
    navigate(`/perfiles/${id}/modulos/nuevo${parent}`)
  }

  const title = current?.label ?? 'Módulos'
  const description = current
    ? `Módulos dentro de ${current.label}. Elige cuáles usa ${detail?.name ?? 'este perfil'}.`
    : `${detail?.name ?? 'Perfil'}. Elige los módulos de este nivel. Los de adentro se abren en otra pantalla.`

  return (
    <AppLayout title={title}>
      <PageHeader
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={goBack}>
              Volver
            </Button>
            <Button type="button" variant="secondary" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
              Nuevo módulo
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !detail}>
              Guardar
            </Button>
          </div>
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
      {message ? <p className="mb-4 text-sm text-sena">{message}</p> : null}

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando módulos…" />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                  <TableHeader width={tableColumns.name}>Módulo</TableHeader>
                  <TableHeader width={tableColumns.relation}>Descripción</TableHeader>
                  <TableHeader align="center" width={tableColumns.count}>
                    Dentro
                  </TableHeader>
                  <TableHeader align="center" width={tableColumns.status}>
                    Asignado
                  </TableHeader>
                  <TableHeader align="center" width={tableColumns.actions}>
                    Acciones
                  </TableHeader>
                </tr>
              </thead>
              <tbody>
                {modules.length === 0 ? (
                  <TableEmpty colSpan={5}>No hay módulos en este nivel.</TableEmpty>
                ) : (
                  modules.map((module) => (
                    <TableRow key={module.id}>
                      <td className="px-5 py-4">
                        <p className="truncate font-semibold text-sena-text">{module.label}</p>
                      </td>
                      <td className="truncate px-5 py-4 font-medium text-sena-dark">
                        {module.description || '—'}
                      </td>
                      <td className="px-5 py-4 text-center text-sena-text/70">{module.children.length}</td>
                      <td className="px-5 py-4 text-center">
                        <label className="inline-flex items-center justify-center gap-2 text-sm text-sena-text">
                          <input
                            type="checkbox"
                            className="size-4 accent-[#00a651]"
                            checked={selectedModules.has(module.id)}
                            onChange={() => handleToggle(module.id)}
                          />
                          <StatusPill tone={selectedModules.has(module.id) ? 'ok' : 'warn'}>
                            {selectedModules.has(module.id) ? 'Sí' : 'No'}
                          </StatusPill>
                        </label>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          className="text-sm font-semibold text-sena hover:underline"
                          onClick={() => navigate(`/perfiles/${id}/modulos/${module.id}`)}
                        >
                          Ver módulos
                        </button>
                      </td>
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </AppLayout>
  )
}
