import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import TextField from '@/shared/components/ui/TextField'
import { PlusIcon, SettingsIcon } from '@/shared/components/icons/AppIcons'
import {
  ErrorBanner,
  FilterCard,
  PageHeader,
  SearchInput,
  TableCard,
  TableLoading,
  TablePagination,
} from '@/shared/components/DataTable'
import { ApiError, api } from '@/shared/lib/api'

const PAGE_SIZE = 12

function asGuias(value: unknown): Guia[] {
  if (Array.isArray(value)) return value.filter(esGuia)
  if (value && typeof value === 'object' && 'data' in value) {
    return asGuias((value as { data: unknown }).data)
  }
  return []
}

function esGuia(value: unknown): value is Guia {
  if (!value || typeof value !== 'object') return false
  const row = value as Partial<Guia>
  return typeof row.id === 'number' && typeof row.titulo === 'string' && typeof row.contenido === 'string'
}

type Guia = {
  id: number
  titulo: string
  modulo: string
  contenido: string
  estado: boolean
}

const EMPTY_FORM = {
  titulo: '',
  modulo: '',
  contenido: '',
  estado: true,
}

export default function AssistantGuidesPage() {
  const [guias, setGuias] = useState<Guia[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const loadGuias = async () => {
    const list = asGuias(await api<unknown>('/assistant/sources?incluirApagadas=true'))
    setGuias(list)
    return list
  }

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Guías del asistente | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        await loadGuias()
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar las guías.')
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
    if (!query) return guias
    return guias.filter((guia) =>
      `${guia.titulo} ${guia.modulo} ${guia.contenido}`.toLowerCase().includes(query),
    )
  }, [guias, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError(null)
  }

  const openEdit = (guia: Guia) => {
    setEditingId(guia.id)
    setForm({
      titulo: guia.titulo,
      modulo: guia.modulo,
      contenido: guia.contenido,
      estado: guia.estado,
    })
    setShowForm(true)
    setError(null)
    window.setTimeout(() => formRef.current?.scrollIntoView({ block: 'start' }), 0)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const titulo = form.titulo.trim()
    const modulo = form.modulo.trim()
    const contenido = form.contenido.trim()
    if (!titulo || !modulo || !contenido) {
      setError('Escribe el título, el módulo y el paso a paso.')
      return
    }

    setSaving(true)
    setError(null)
    const payload = { titulo, modulo, contenido, estado: form.estado }

    try {
      if (editingId === null) {
        await api<Guia>('/assistant/sources', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await api<Guia>(`/assistant/sources/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      }
      closeForm()
      setSearch('')
      await loadGuias()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar la guía.')
    } finally {
      setSaving(false)
    }
  }

  const toggleEstado = async (guia: Guia) => {
    setBusyId(guia.id)
    setError(null)
    try {
      await api<Guia>(`/assistant/sources/${guia.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: !guia.estado }),
      })
      await loadGuias()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo cambiar el estado de la guía.')
    } finally {
      setBusyId(null)
    }
  }

  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageRows.length
  const contenidoLargo = form.contenido.length > 4500

  return (
    <AppLayout title="Guías del asistente">
      <PageHeader
        icon={<SettingsIcon />}
        title="Guías del asistente"
        description={
          loading
            ? 'Lo que escribes aquí es lo que el chat responde. Si apagas una guía, deja de usarla.'
            : `${guias.length} guías cargadas. El chat responde con las encendidas. Edita cualquiera si el texto debe cambiar.`
        }
        action={
          <Button type="button" icon={<PlusIcon className="size-4" />} onClick={showForm && editingId === null ? closeForm : openCreate}>
            Nueva guía
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      {showForm ? (
        <form
          ref={formRef}
          className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sena-dark/8"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              id="guia-titulo"
              label="Título"
              value={form.titulo}
              maxLength={200}
              required
              placeholder="Cómo pedir un material"
              onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
            />
            <TextField
              id="guia-modulo"
              label="Módulo"
              value={form.modulo}
              maxLength={120}
              required
              placeholder="Solicitudes de material"
              onChange={(event) => setForm((current) => ({ ...current, modulo: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="guia-contenido" className="form-label">
              Paso a paso
            </label>
            <textarea
              id="guia-contenido"
              value={form.contenido}
              maxLength={5000}
              rows={6}
              required
              className="form-field h-auto min-h-36 resize-y px-3.5 py-3"
              placeholder="Entra al módulo, elige la ficha y envía la solicitud."
              onChange={(event) => setForm((current) => ({ ...current, contenido: event.target.value }))}
            />
            {contenidoLargo ? (
              <p className="text-sm text-sena-strong">
                {form.contenido.length}/5000
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-sena-text">
            <input
              type="checkbox"
              checked={form.estado}
              onChange={(event) => setForm((current) => ({ ...current, estado: event.target.checked }))}
            />
            El chat puede usar esta guía
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : editingId === null ? 'Crear guía' : 'Guardar cambios'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <FilterCard>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título, módulo o texto…" />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando guías…" />
        ) : (
          <>
            {pageRows.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-sena-text-soft">
                {error
                  ? 'No se pudieron cargar las guías. Revisa que el servidor esté encendido y vuelve a entrar.'
                  : guias.length === 0
                    ? 'Todavía no hay guías. Escribe la primera y el chat podrá responder con ella.'
                    : 'Ninguna guía coincide con la búsqueda.'}
              </p>
            ) : (
              <ul>
                {pageRows.map((guia) => (
                  <li
                    key={guia.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-sena-hairline/90 px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-[220px] max-w-xl">
                      <p className="font-semibold text-sena-text">{guia.titulo}</p>
                      <p className="mt-1 text-sm text-sena-dark">{guia.modulo}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={guia.estado ? 'ok' : 'danger'}>
                        {guia.estado ? 'Encendida' : 'Apagada'}
                      </StatusPill>
                      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(guia)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={busyId === guia.id}
                        onClick={() => void toggleEstado(guia)}
                      >
                        {guia.estado ? 'Apagar' : 'Encender'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              from={from}
              to={to}
              total={filtered.length}
              noun="guías"
            />
          </>
        )}
      </TableCard>
    </AppLayout>
  )
}
