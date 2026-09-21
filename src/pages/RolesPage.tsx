import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { StatusPill } from '../components/modules/ResourceBoard'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import { PlusIcon, SearchIcon } from '../components/icons/AppIcons'
import { cn } from '../lib/cn'
import { ApiError, api } from '../lib/api'
import type { ModuleNode, Role, RoleDetail } from '../types/profile'

const PAGE_SIZE = 8

function collectGranted(nodes: ModuleNode[], selected: Set<number>) {
  for (const node of nodes) {
    if (node.granted) selected.add(node.id)
    collectGranted(node.children, selected)
  }
  return selected
}

function ModuleTree({
  nodes,
  selected,
  onToggle,
  depth = 0,
}: {
  nodes: ModuleNode[]
  selected: Set<number>
  onToggle: (id: number) => void
  depth?: number
}) {
  if (!nodes.length) {
    return <p className="text-sm text-sena-text/55">No hay módulos en el catálogo todavía.</p>
  }

  return (
    <ul className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1 border-l border-sena-dark/10 pl-4'}>
      {nodes.map((node) => (
        <li key={node.id}>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-sena-muted">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[#00a651]"
              checked={selected.has(node.id)}
              onChange={() => onToggle(node.id)}
            />
            <span>
              <span className="block text-sm font-medium text-sena-text">{node.label}</span>
              {node.description ? (
                <span className="block text-xs text-sena-text/50">{node.description}</span>
              ) : null}
            </span>
          </label>
          {node.children.length ? (
            <ModuleTree nodes={node.children} selected={selected} onToggle={onToggle} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function parentOptions(nodes: ModuleNode[], prefix = ''): Array<{ id: number; label: string }> {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${prefix}${node.label}` },
    ...parentOptions(node.children, `${prefix}${node.label} / `),
  ])
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<RoleDetail | null>(null)
  const [selectedModules, setSelectedModules] = useState<Set<number>>(new Set())
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [moduleDescription, setModuleDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadRoles = async () => {
    const list = await api<Role[]>('/roles')
    setRoles(list)
    return list
  }

  const loadDetail = async (id: number) => {
    const next = await api<RoleDetail>(`/roles/${id}`)
    setDetail(next)
    setSelectedModules(collectGranted(next.tree, new Set()))
  }

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Perfiles | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        await loadRoles()
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar los perfiles.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return roles
    return roles.filter((role) =>
      `${role.id} ${role.name} ${role.description}`.toLowerCase().includes(query),
    )
  }, [roles, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  const options = useMemo(() => (detail ? parentOptions(detail.tree) : []), [detail])

  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const created = await api<Role>('/roles', {
        method: 'POST',
        body: JSON.stringify({ name, description: description || undefined }),
      })
      setName('')
      setDescription('')
      setShowCreate(false)
      setSearch('')
      const list = await loadRoles()
      const index = list.findIndex((role) => role.id === created.id)
      setPage(index >= 0 ? Math.floor(index / PAGE_SIZE) + 1 : 1)
      setSelectedId(created.id)
      await loadDetail(created.id)
      setMessage(`Perfil “${created.name}” creado. Ya aparece en la tabla.`)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo crear el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectRole = async (id: number) => {
    setSelectedId(id)
    setError(null)
    setMessage(null)
    try {
      await loadDetail(id)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo abrir el perfil.')
    }
  }

  const handleToggle = (id: number) => {
    setSelectedModules((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSaveModules = async () => {
    if (!selectedId) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const next = await api<RoleDetail>(`/roles/${selectedId}/modules`, {
        method: 'PUT',
        body: JSON.stringify({ moduleIds: [...selectedModules] }),
      })
      setDetail(next)
      setSelectedModules(collectGranted(next.tree, new Set()))
      setMessage('Permisos guardados. Marcar un padre no concede los hijos.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron guardar los módulos.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateModule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const created = await api<{ label: string }>('/modules/catalog', {
        method: 'POST',
        body: JSON.stringify({
          name: moduleName,
          description: moduleDescription || undefined,
          parentId: parentId ? Number(parentId) : undefined,
        }),
      })
      setModuleName('')
      setModuleDescription('')
      setParentId('')
      if (selectedId) await loadDetail(selectedId)
      setMessage(`Módulo “${created.label}” creado en el catálogo.`)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo crear el módulo.')
    } finally {
      setSaving(false)
    }
  }

  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length

  return (
    <AppLayout title="Perfiles">
      <div className="rounded-2xl bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-sena-text">Perfiles</h1>
        <p className="mt-1 max-w-3xl text-sm text-sena-text/60">
          Tipos de usuario de la plataforma. Busque en la tabla, cree uno nuevo y asígnele módulos.
          Marcar un padre no da permiso sobre los hijos.
        </p>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-sena">{message}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex h-11 w-full max-w-md items-center gap-2 rounded-xl bg-sena-muted px-3">
            <SearchIcon className="size-4 text-sena-text/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar perfil..."
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-sena-text/40"
            />
          </label>
          <Button
            type="button"
            icon={<PlusIcon className="size-4" />}
            onClick={() => setShowCreate((open) => !open)}
            className="h-11 rounded-xl"
          >
            Nuevo perfil
          </Button>
        </div>

        {showCreate ? (
          <form className="mt-5 grid gap-3 rounded-xl bg-sena-muted p-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreateRole}>
            <TextField
              id="roleName"
              label="Nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Aprendiz"
              required
            />
            <TextField
              id="roleDescription"
              label="Descripción"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Opcional"
            />
            <div className="flex items-end">
              <Button type="submit" disabled={saving || !name.trim()}>
                Crear
              </Button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-sena-text/60">Cargando perfiles…</p>
        ) : (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sena-dark/10 text-sena-text/55">
                    <th className="px-3 py-3 font-medium">ID</th>
                    <th className="px-3 py-3 font-medium">Nombre</th>
                    <th className="px-3 py-3 font-medium">Descripción</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-3 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length ? (
                    pageRows.map((role) => (
                      <tr
                        key={role.id}
                        className={cn(
                          'cursor-pointer border-b border-sena-dark/8 last:border-b-0 hover:bg-sena-muted/80',
                          selectedId === role.id && 'bg-sena/8 hover:bg-sena/8',
                        )}
                        onClick={() => void handleSelectRole(role.id)}
                      >
                        <td className="px-3 py-3 text-sena-text/70">{role.id}</td>
                        <td className="px-3 py-3 font-medium text-sena-text">{role.name}</td>
                        <td className="max-w-xs truncate px-3 py-3 text-sena-text/70">
                          {role.description || '—'}
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill tone={role.active ? 'ok' : 'danger'}>
                            {role.active ? 'Activo' : 'Inactivo'}
                          </StatusPill>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            className="text-sm font-semibold text-sena hover:underline"
                            onClick={() => void handleSelectRole(role.id)}
                          >
                            Asignar módulos
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-sena-text/50">
                        No hay perfiles que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-sena-text/50">
                Mostrando {from} - {to} de {filtered.length} registros
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn(
                      'grid size-8 place-items-center rounded-lg text-sm',
                      item === currentPage ? 'bg-sena text-white' : 'text-sena-text/60 hover:bg-sena-muted',
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {detail ? (
        <section className="mt-4 rounded-2xl bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-sena-text">Módulos de {detail.name}</h2>
              <p className="mt-1 text-sm text-sena-text/55">
                {detail.description || 'Marquen solo lo que este perfil puede hacer.'}
              </p>
            </div>
            <Button type="button" onClick={() => void handleSaveModules()} disabled={saving}>
              Guardar módulos
            </Button>
          </div>

          <div className="mt-6">
            <ModuleTree nodes={detail.tree} selected={selectedModules} onToggle={handleToggle} />
          </div>

          <form
            className="mt-8 grid gap-3 border-t border-sena-dark/10 pt-5 sm:grid-cols-2"
            onSubmit={handleCreateModule}
          >
            <h3 className="text-sm font-semibold text-sena-text sm:col-span-2">Nuevo módulo en el catálogo</h3>
            <TextField
              id="moduleName"
              label="Nombre del módulo"
              value={moduleName}
              onChange={(event) => setModuleName(event.target.value)}
              placeholder="Nombre de la aplicación o de la acción"
              required
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="moduleParent" className="text-sm font-medium text-sena-text/65">
                Padre (opcional)
              </label>
              <select
                id="moduleParent"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                className="h-11 w-full rounded-lg border border-transparent bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:border-sena focus:bg-white focus:ring-2 focus:ring-sena/20"
              >
                <option value="">Ninguno: queda como padre</option>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              id="moduleDescription"
              label="Descripción"
              value={moduleDescription}
              onChange={(event) => setModuleDescription(event.target.value)}
              placeholder="Opcional"
            />
            <div className="flex items-end">
              <Button type="submit" variant="secondary" disabled={saving || !moduleName.trim()}>
                Crear módulo
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </AppLayout>
  )
}
