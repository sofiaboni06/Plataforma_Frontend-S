import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import { StatusPill } from '@/shared/components/ResourceBoard'
import {
  ActionButton,
  ClearFiltersButton,
  ErrorBanner,
  FilterCard,
  PageHeader,
  RowActions,
  SearchInput,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TablePagination,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { ProgramIcon, TrashIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'

type Programa = { id: number; codigo: string; nombre: string }
type Centro = { id: number; name: string }
type Elemento = { id: number; codigo: string | null; nombre: string }
type Item = {
  id: number
  elemento: { id: number; codigo: string | null; nombre: string } | null
  cantidadBase: number
  observaciones: string | null
  estado: boolean
}

const PAGE_SIZE = 8

export default function ListasMaestrasMaterialPage() {
  const [programas, setProgramas] = useState<Programa[]>([])
  const [centros, setCentros] = useState<Centro[]>([])
  const [elementos, setElementos] = useState<Elemento[]>([])
  const [programaId, setProgramaId] = useState('')
  const [centroId, setCentroId] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [manualElemento, setManualElemento] = useState('')
  const [manualCantidad, setManualCantidad] = useState('1')
  const [manualObs, setManualObs] = useState('')

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Lista de materiales | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const [ps, cs, es] = await Promise.all([
          api<Programa[]>('/programas-formacion'),
          api<Centro[]>('/training-centers').catch(() => [] as Centro[]),
          api<Elemento[]>('/inventario/elementos'),
        ])
        setProgramas(ps as any)
        setCentros(cs as any)
        setElementos(es as any)
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar la informaciÃ³n base.')
      }
    })()
  }, [])

  const load = async () => {
    if (!programaId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api<any>(
        `/listas-maestras-material?programaId=${programaId}${centroId ? `&centroId=${centroId}` : ''}`,
      )
      const list = data?.data?.items ?? data?.items ?? data?.data ?? []
      setItems(Array.isArray(list) ? list : [])
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar la lista.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programaId, centroId])

  useEffect(() => {
    setPage(1)
  }, [search])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) =>
      `${it.elemento?.codigo ?? ''} ${it.elemento?.nombre ?? ''} ${it.observaciones ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageItems.length

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !programaId) return
    const form = new FormData()
    form.append('archivo', file)
    form.append('programaId', programaId)
    if (centroId) form.append('centroId', centroId)
    try {
      const res = await api<any>('/listas-maestras-material/importar', {
        method: 'POST',
        body: form,
      })
      const n = res?.data?.items?.length ?? res?.items?.length ?? 0
      setMessage(`Se importaron ${n} registros.`)
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo importar el archivo.')
    } finally {
      event.target.value = ''
    }
  }

  const handleManual = async (event: FormEvent) => {
    event.preventDefault()
    if (!programaId || !manualElemento) return
    try {
      await api('/listas-maestras-material', {
        method: 'POST',
        body: JSON.stringify({
          programaId: Number(programaId),
          centroId: centroId ? Number(centroId) : null,
          elementoId: Number(manualElemento),
          cantidadBase: Number(manualCantidad) || 1,
          observaciones: manualObs || null,
        }),
      })
      setMessage('Material agregado.')
      setManualElemento('')
      setManualCantidad('1')
      setManualObs('')
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo agregar el material.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api(`/listas-maestras-material/${id}`, { method: 'DELETE' })
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo eliminar.')
    }
  }

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const rows = [
      ['Código', 'Nombre', 'Cantidad', 'Unidad', 'Observaciones'],
      ['EJ-001', 'Ejemplo de elemento', 2, 'unidad', 'Ejemplo de observación'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de materiales')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_lista_materiales.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout title="Lista de materiales">
      <PageHeader
        icon={<ProgramIcon />}
        title="Lista de materiales"
        description="Lista maestra de materiales por programa de formaciÃ³n. CÃ¡rgala desde Excel o agrÃ©gala manualmente."
      />
      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
      {message ? (
        <p className="mb-4 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-3.5 text-sm text-sena-ok-text">
          {message}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-sena-text/70">Programa</label>
          <select
            value={programaId}
            onChange={(e) => setProgramaId(e.target.value)}
            className="form-field form-select min-w-[16rem]"
          >
            <option value="">Seleccione un programa</option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-sena-text/70">Centro</label>
          <select
            value={centroId}
            onChange={(e) => setCentroId(e.target.value)}
            className="form-field form-select min-w-[14rem]"
          >
            <option value="">Todos los centros</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={() => void downloadTemplate()}>
          Descargar plantilla
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sena-line bg-white px-4 py-2 text-sm font-semibold text-sena-dark shadow-hairline transition hover:border-sena/45">
          Subir Excel
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <form onSubmit={handleManual} className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-sena-text/70">Elemento</label>
          <select
            value={manualElemento}
            onChange={(e) => setManualElemento(e.target.value)}
            className="form-field form-select min-w-[16rem]"
          >
            <option value="">Seleccione un elemento</option>
            {elementos.map((el) => (
              <option key={el.id} value={el.id}>
                {el.codigo ? `${el.codigo} - ` : ''}
                {el.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-sena-text/70">Cantidad</label>
          <input
            type="number"
            min={1}
            value={manualCantidad}
            onChange={(e) => setManualCantidad(e.target.value)}
            className="form-field w-24"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-sena-text/70">Observaciones</label>
          <input
            type="text"
            value={manualObs}
            onChange={(e) => setManualObs(e.target.value)}
            className="form-field min-w-[16rem]"
          />
        </div>
        <Button type="submit" disabled={!programaId || !manualElemento}>
          Agregar
        </Button>
      </form>

      <FilterCard>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cÃ³digo, elemento u observaciÃ³n..." />
        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando lista de materialesâ€¦" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[16%]">CÃ³digo</TableHeader>
                    <TableHeader>Elemento</TableHeader>
                    <TableHeader width="w-[14%]">Cantidad base</TableHeader>
                    <TableHeader>Observaciones</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <TableEmpty colSpan={5}>
                      {items.length === 0
                        ? 'No hay materiales en esta lista. Carga un Excel o agrÃ©galos manualmente.'
                        : 'No hay materiales que coincidan con la bÃºsqueda.'}
                    </TableEmpty>
                  ) : (
                    pageItems.map((it) => (
                      <TableRow key={it.id}>
                        <td className="truncate font-semibold text-sena-strong">
                          {it.elemento?.codigo ?? 'â€”'}
                        </td>
                        <td className="min-w-0">
                          <p className="truncate font-semibold text-sena-text">{it.elemento?.nombre ?? 'â€”'}</p>
                        </td>
                        <td className="text-sena-strong">
                          <StatusPill tone="ok">{String(it.cantidadBase)}</StatusPill>
                        </td>
                        <td className="truncate text-sena-text/70">{it.observaciones ?? 'â€”'}</td>
                        <td>
                          <RowActions>
                            <ActionButton title="Eliminar" onClick={() => void handleDelete(it.id)}>
                              <TrashIcon className="size-[18px]" />
                            </ActionButton>
                          </RowActions>
                        </td>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              from={from}
              to={to}
              total={filtered.length}
              noun="materiales"
            />
          </>
        )}
      </TableCard>
    </AppLayout>
  )
}
