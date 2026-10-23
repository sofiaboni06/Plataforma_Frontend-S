import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import SelectField from '@/shared/components/ui/SelectField'
import TextField from '@/shared/components/ui/TextField'
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
import { ExcelIcon, PencilIcon, PlusIcon, ProgramIcon, TrashIcon } from '@/shared/components/icons/AppIcons'
import { ApiError, api } from '@/shared/lib/api'
import {
  createListaMaestra,
  deleteListaMaestra,
  downloadPlantillaListaMaestra,
  getListaMaestra,
  importListaMaestra,
  updateListaMaestra,
  type ListaMaestraItem,
} from '@/modules/materiales-formacion/data/listaMaestra'
import { useFormacionAccess } from '@/modules/materiales-formacion/useFormacionAccess'

type Programa = { id: number; codigo: string; nombre: string }

const PAGE_SIZE = 8

const EMPTY_FORM = {
  codigoUnspsc: '',
  producto: '',
  descripcionTecnica: '',
  unidadMedida: 'Unidad',
  cantidadBase: '1',
  caracter: '',
  observaciones: '',
}

type MaterialForm = typeof EMPTY_FORM

export default function ListasMaestrasMaterialPage() {
  const { can, isAdmin } = useFormacionAccess()
  const canWrite = can('listas', 'create')
  const canEdit = can('listas', 'edit')
  const backTo = isAdmin ? '/formacion/programas' : '/materiales-formacion'
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [searchParams] = useSearchParams()
  const [programas, setProgramas] = useState<Programa[]>([])
  const programaId = searchParams.get('programaId') ?? ''
  const [items, setItems] = useState<ListaMaestraItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [erroresExcel, setErroresExcel] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Lista de materiales | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    if (!searchParams.get('programaId')) {
      navigate(backTo, { replace: true })
    }
  }, [navigate, searchParams])

  useEffect(() => {
    void (async () => {
      try {
        const list = await api<Programa[]>(isAdmin ? '/programas-formacion' : '/account/programas')
        setProgramas(Array.isArray(list) ? list : [])
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar los programas.')
      }
    })()
  }, [isAdmin])

  const load = async (id: string) => {
    if (!id) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      setItems(await getListaMaestra(Number(id)))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar la lista maestra.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(programaId)
  }, [programaId])

  useEffect(() => {
    setPage(1)
  }, [search, programaId])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) =>
      `${item.codigoUnspsc} ${item.producto} ${item.observaciones ?? ''}`
        .toLowerCase()
        .includes(query),
    )
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : pageStart + 1
  const to = pageStart + pageItems.length
  const programa = programas.find((item) => String(item.id) === programaId)

  const openForm = (item?: ListaMaestraItem) => {
    setEditingId(item?.id ?? null)
    setForm(
      item
        ? {
            codigoUnspsc: item.codigoUnspsc,
            producto: item.producto,
            descripcionTecnica: item.descripcionTecnica ?? '',
            unidadMedida: item.unidadMedida ?? 'Unidad',
            cantidadBase: String(item.cantidadBase),
            caracter: item.caracter ?? '',
            observaciones: item.observaciones ?? '',
          }
        : EMPTY_FORM,
    )
    setFormError(null)
    setFormOpen(true)
  }

  const handlePlantilla = async () => {
    try {
      await downloadPlantillaListaMaestra(programaId ? Number(programaId) : undefined)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo descargar la plantilla.')
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !programaId) return
    setUploading(true)
    setError(null)
    setMessage(null)
    try {
      const result = await importListaMaestra(Number(programaId), file)
      const extra = result.errores.length ? ` Quedaron ${result.errores.length} filas por revisar.` : ''
      setMessage(`Se cargaron ${result.carga.registrosOk} materiales desde el Excel.${extra}`)
      setErroresExcel(result.errores)
      await load(programaId)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo importar el anexo.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleManual = async (event: FormEvent) => {
    event.preventDefault()
    if (!programaId) return
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        codigoUnspsc: form.codigoUnspsc.trim(),
        producto: form.producto.trim(),
        descripcionTecnica: form.descripcionTecnica.trim() || null,
        unidadMedida: form.unidadMedida.trim() || null,
        cantidadBase: Number(form.cantidadBase) || 1,
        caracter: (form.caracter || null) as ListaMaestraItem['caracter'],
        observaciones: form.observaciones.trim() || null,
      }
      if (editingId) {
        await updateListaMaestra(editingId, payload)
        setMessage('Material actualizado en la lista del programa.')
      } else {
        await createListaMaestra({ programaId: Number(programaId), ...payload })
        setMessage('Material agregado a la lista del programa.')
      }
      setFormOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await load(programaId)
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el material.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteListaMaestra(id)
      await load(programaId)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo eliminar.')
    }
  }

  const patchForm = (field: keyof MaterialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <AppLayout title="Lista de materiales">
      <PageHeader
        icon={<ProgramIcon />}
        title={programa ? `Lista maestra · ${programa.codigo}` : 'Lista maestra de materiales'}
        description={
          programa
            ? `${programa.nombre}. Descarga la plantilla, súbela en Excel o agrega y edita materiales uno a uno.`
            : 'Descarga la plantilla, súbela en Excel o agrega y edita materiales uno a uno.'
        }
        action={
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                icon={<ExcelIcon className="size-4" />}
                onClick={() => void handlePlantilla()}
              >
                Descargar plantilla
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon={<ExcelIcon className="size-4" />}
                disabled={!programaId || uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? 'Cargando Excel…' : 'Subir Excel'}
              </Button>
              <Button
                type="button"
                icon={<PlusIcon className="size-4" />}
                disabled={!programaId}
                onClick={() => openForm()}
              >
                Agregar material
              </Button>
            </div>
          ) : undefined
        }
      />
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleUpload}
      />

      {error ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}
      {message ? (
        <p className="mb-4 rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-3.5 text-sm text-sena-ok-text">
          {message}
        </p>
      ) : null}
      {erroresExcel.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-sena-warn-line bg-white px-5 py-3.5 text-sm text-sena-text">
          <p className="font-semibold text-sena-dark">
            El Excel dejó filas pendientes. Agrégalas con «Agregar material».
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sena-text/80">
            {erroresExcel.slice(0, 8).map((fila) => (
              <li key={fila}>{fila}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <FilterCard>
        <Link
          to={backTo}
          className="inline-flex h-11 items-center rounded-xl border border-sena-line bg-white px-4 text-sm font-semibold text-sena-dark shadow-hairline transition hover:border-sena/45 hover:text-sena"
        >
          Volver a programas
        </Link>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por UNSPSC, producto u observación..."
        />
        <ClearFiltersButton onClick={() => setSearch('')} disabled={!search} />
      </FilterCard>

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando lista de materiales…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-hairline bg-sena-soft/85">
                    <TableHeader width="w-[14%]">UNSPSC</TableHeader>
                    <TableHeader>Producto</TableHeader>
                    <TableHeader width="w-[12%]">Unidad</TableHeader>
                    <TableHeader width="w-[12%]">Cantidad base</TableHeader>
                    <TableHeader>Observaciones</TableHeader>
                    <TableHeader align="center" width={tableColumns.actions}>
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <TableEmpty colSpan={6}>
                      {!programaId
                        ? 'Abra la lista desde acciones del programa.'
                        : items.length === 0
                          ? 'Este programa no tiene materiales. Súbelos con Excel o agrégalos con el formulario.'
                          : 'No hay materiales que coincidan con la búsqueda.'}
                    </TableEmpty>
                  ) : (
                    pageItems.map((item) => (
                      <TableRow key={item.id}>
                        <td className="truncate font-semibold text-sena-strong">{item.codigoUnspsc}</td>
                        <td className="min-w-0">
                          <p className="truncate font-semibold text-sena-text">{item.producto}</p>
                          {item.descripcionTecnica ? (
                            <p className="truncate text-xs text-sena-text/60">{item.descripcionTecnica}</p>
                          ) : null}
                        </td>
                        <td>{item.unidadMedida ?? '—'}</td>
                        <td>
                          <StatusPill tone="ok">{String(item.cantidadBase)}</StatusPill>
                        </td>
                        <td className="truncate text-sena-text/70">{item.observaciones ?? '—'}</td>
                        <td>
                          <RowActions>
                            {canEdit ? (
                              <ActionButton title="Editar material" onClick={() => openForm(item)}>
                                <PencilIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
                            {can('listas', 'delete') ? (
                              <ActionButton title="Eliminar" onClick={() => void handleDelete(item.id)}>
                                <TrashIcon className="size-[18px]" />
                              </ActionButton>
                            ) : null}
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

      {formOpen ? (
        <Modal
          title={editingId ? 'Editar material' : 'Agregar material a la lista'}
          description={
            editingId
              ? 'Cambia la cantidad, la descripción o el tipo de este material del programa.'
              : 'Completa un material que no vino en el Excel o que quieras sumar a este programa.'
          }
          onClose={() => {
            setFormOpen(false)
            setEditingId(null)
          }}
          wide
          spacious
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleManual}>
            {formError ? (
              <p className="sm:col-span-2 rounded-xl bg-sena-danger-soft px-4 py-3 text-sm text-sena-danger-text">
                {formError}
              </p>
            ) : null}
            <TextField
              id="lm-unspsc"
              label="Código UNSPSC"
              value={form.codigoUnspsc}
              onChange={(event) => patchForm('codigoUnspsc', event.target.value)}
              maxLength={20}
              required
            />
            <TextField
              id="lm-cantidad"
              label="Cantidad para 30 aprendices"
              type="number"
              min={1}
              step="0.001"
              value={form.cantidadBase}
              onChange={(event) => patchForm('cantidadBase', event.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <TextField
                id="lm-producto"
                label="Producto"
                value={form.producto}
                onChange={(event) => patchForm('producto', event.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                id="lm-descripcion"
                label="Descripción técnica"
                value={form.descripcionTecnica}
                onChange={(event) => patchForm('descripcionTecnica', event.target.value)}
              />
            </div>
            <TextField
              id="lm-unidad"
              label="Unidad de medida"
              value={form.unidadMedida}
              onChange={(event) => patchForm('unidadMedida', event.target.value)}
            />
            <SelectField
              id="lm-caracter"
              label="Tipo"
              value={form.caracter}
              onChange={(value) => patchForm('caracter', value)}
              placeholder="Opcional"
              required={false}
              options={[
                { value: 'consumo', label: 'Consumo' },
                { value: 'devolutivo', label: 'Devolutivo' },
                { value: 'software', label: 'Software' },
              ]}
            />
            <div className="sm:col-span-2">
              <TextField
                id="lm-obs"
                label="Observaciones"
                value={form.observaciones}
                onChange={(event) => patchForm('observaciones', event.target.value)}
              />
            </div>
            <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormOpen(false)
                  setEditingId(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar a la lista'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppLayout>
  )
}
