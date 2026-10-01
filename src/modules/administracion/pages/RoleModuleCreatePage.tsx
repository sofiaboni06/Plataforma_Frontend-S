import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import TextField from '@/shared/components/ui/TextField'
import { ErrorBanner, PageHeader } from '@/shared/components/DataTable'
import { SettingsIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import type { ModuleNode, RoleDetail } from '@/shared/types/profile'

function flatten(nodes: ModuleNode[], prefix = ''): Array<{ id: number; label: string }> {
  return nodes.flatMap((node) => [
    { id: node.id, label: `${prefix}${node.label}` },
    ...flatten(node.children, `${prefix}${node.label} / `),
  ])
}

export default function RoleModuleCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const parentFromQuery = searchParams.get('padre') ?? ''
  const [parentId, setParentId] = useState(parentFromQuery)
  const [options, setOptions] = useState<Array<{ id: number; label: string }>>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const backTo = useMemo(() => {
    if (!id) return '/perfiles'
    return parentId ? `/perfiles/${id}/modulos/${parentId}` : `/perfiles/${id}/modulos`
  }, [id, parentId])

  useEffect(() => {
    document.title = 'Nuevo módulo | SENA'
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id) return
      try {
        const detail = await api<RoleDetail>(`/roles/${id}`)
        if (!cancelled) setOptions(flatten(detail.tree))
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el catálogo.')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api('/modules/catalog', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || undefined,
          parentId: parentId ? Number(parentId) : undefined,
        }),
      })
      navigate(backTo)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo crear el módulo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Nuevo módulo">
      <PageHeader
        icon={<SettingsIcon />}
        title="Nuevo módulo"
        description="Se crea en el catálogo. Después lo asignas desde la tabla de módulos."
        action={
          <Button type="button" variant="secondary" onClick={() => navigate(backTo)}>
            Volver
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <form
        onSubmit={handleSubmit}
        className="grid max-w-3xl gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sena-dark/8 sm:p-8"
      >
        <TextField
          id="moduleName"
          label="Nombre del módulo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre de la aplicación o de la acción"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="moduleParent" className="text-sm font-medium text-sena-text/75">
            Padre (opcional)
          </label>
          <select
            id="moduleParent"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="h-11 w-full rounded-lg border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20"
          >
            <option value="">Ninguno: queda en el primer nivel</option>
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
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Opcional"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Guardando...' : 'Crear módulo'}
          </Button>
        </div>
      </form>
    </AppLayout>
  )
}
