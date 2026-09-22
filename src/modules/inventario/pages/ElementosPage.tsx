import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
import { ApiError } from '@/shared/lib/api'
import { api } from '@/shared/lib/api'
import { getBodegas } from '@/modules/inventario/data/bodega'
import {
  createElemento,
  getElementos,
  getUnidadesMedida,
  updateElemento,
} from '@/modules/inventario/data/elemento'
import type { BodegaApi, StandApi } from '@/modules/inventario/types/bodega'
import type {
  CreateElementoPayload,
  ElementoApi,
  UnidadMedidaApi,
} from '@/modules/inventario/types/elemento'
import type { CategoryApi, SubcategoryApi } from '@/shared/types/category'

const emptyForm: CreateElementoPayload = {
  idSubcategoria: 0,
  idStand: 0,
  nombre: '',
  cantidad: 0,
  estado: true,
  idUnidadMedida: 0,
  codigo: '',
  descripcion: '',
  marca: '',
  urlFotografia: '',
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={active
      ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
      : 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export default function ElementosPage() {
  const [elementos, setElementos] = useState<ElementoApi[]>([])
  const [categories, setCategories] = useState<CategoryApi[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryApi[]>([])
  const [bodegas, setBodegas] = useState<BodegaApi[]>([])
  const [unidades, setUnidades] = useState<UnidadMedidaApi[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateElementoPayload>(emptyForm)
  const [categoryId, setCategoryId] = useState(0)
  const [bodegaId, setBodegaId] = useState(0)

  const stands = useMemo<StandApi[]>(
    () => bodegas.flatMap((bodega) => bodega.stands ?? []),
    [bodegas],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return elementos

    return elementos.filter((item) => {
      const category = categories.find((categoryItem) => categoryItem.id === selectedCategoryId(item, subcategories))
      const values = [
        item.id,
        item.codigo,
        item.nombre,
        item.marca ?? '',
        item.subcategoria?.nombre ?? '',
        category?.nombre ?? '',
        item.stand?.nombre ?? '',
        item.unidadMedida?.nombre ?? '',
      ]
      return values.join(' ').toLowerCase().includes(term)
    })
  }, [categories, elementos, search, subcategories])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [elementoData, categoryData, subcategoryData, bodegaData, unidadData] = await Promise.all([
        getElementos(),
        api<CategoryApi[]>('/categorias'),
        api<SubcategoryApi[]>('/subcategorias'),
        getBodegas(),
        getUnidadesMedida(),
      ])
      setElementos(elementoData)
      setCategories(categoryData)
      setSubcategories(subcategoryData)
      setBodegas(bodegaData)
      setUnidades(unidadData)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudieron cargar los elementos del inventario.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Elementos | Inventario | SENA'
    void loadData()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setCategoryId(0)
    setBodegaId(0)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function openEdit(item: ElementoApi) {
    setEditingId(item.id)
    setForm({
      idSubcategoria: item.idSubcategoria,
      idStand: item.idStand,
      nombre: item.nombre,
      cantidad: item.cantidad,
      estado: item.estado,
      idUnidadMedida: item.idUnidadMedida,
      codigo: item.codigo,
      descripcion: item.descripcion ?? '',
      marca: item.marca ?? '',
      urlFotografia: item.urlFotografia ?? '',
    })
    setCategoryId(subcategories.find((subcategory) => subcategory.id === item.idSubcategoria)?.idCategoria ?? 0)
    setBodegaId(bodegas.find((bodega) => bodega.stands?.some((stand) => stand.id === item.idStand || stand.idStand === item.idStand))?.id_bodega ?? 0)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function updateForm<K extends keyof CreateElementoPayload>(key: K, value: CreateElementoPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)

    const payload: CreateElementoPayload = {
      ...form,
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      descripcion: form.descripcion?.trim() || null,
      marca: form.marca?.trim() || null,
      urlFotografia: form.urlFotografia?.trim() || null,
      cantidad: Number(form.cantidad),
      idSubcategoria: Number(form.idSubcategoria),
      idStand: Number(form.idStand),
      idUnidadMedida: Number(form.idUnidadMedida),
    }

    try {
      const saved = editingId
        ? await updateElemento(editingId, payload)
        : await createElemento(payload)

      setElementos((current) => {
        if (!editingId) return [...current, saved].sort((a, b) => a.id - b.id)
        return current.map((item) => item.id === editingId ? saved : item)
      })
      setModalOpen(false)
      setNotice(editingId ? 'Elemento actualizado correctamente.' : 'Elemento creado correctamente.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el elemento.')
    } finally {
      setSaving(false)
    }
  }

  const categoryNameBySubcategory = (subcategoryId: number) => {
    const subcategory = subcategories.find((item) => item.id === subcategoryId)
    if (!subcategory) return '—'
    return categories.find((item) => item.id === subcategory.idCategoria)?.nombre ?? '—'
  }

  const bodegaNameByStand = (standId: number) => {
    const bodega = bodegas.find((item) => item.stands?.some((stand) => stand.id === standId || stand.idStand === standId))
    return bodega?.nombre ?? '—'
  }

  return (
    <AppLayout title="Elementos">
      <section className="mx-auto max-w-[1500px] pt-3 sm:pt-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sena-dark/5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sena/90">Inventario</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-sena-text">Elementos</h1>
            <p className="mt-1 max-w-2xl text-sm text-sena-text/55">Consulta y administra los elementos registrados en la base de datos del inventario.</p>
          </div>
          <Button icon={<PlusIcon />} onClick={openCreate}>Nuevo elemento</Button>
        </div>

        {notice ? <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div> : null}
        {error && !modalOpen ? <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/5">
          <div className="flex flex-col gap-3 border-b border-sena-text/8 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-semibold text-sena-text">Elementos registrados</h2>
              <p className="mt-0.5 text-xs text-sena-text/50">{filtered.length} de {elementos.length} registros</p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Buscar elementos</span>
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sena-text/45"><SearchIcon /></span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código, nombre, categoría..." className="h-10 w-full rounded-lg bg-sena-muted pl-10 pr-3 text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-sena/30" />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="bg-sena-muted/70 text-xs uppercase tracking-wide text-sena-text/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Código</th>
                  <th className="px-5 py-3 font-semibold">Elemento</th>
                  <th className="px-5 py-3 font-semibold">Categoría</th>
                  <th className="px-5 py-3 font-semibold">Subcategoría</th>
                  <th className="px-5 py-3 font-semibold">Bodega / Stand</th>
                  <th className="px-5 py-3 font-semibold">Cantidad</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sena-text/8">
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-sena-text/50">Cargando elementos...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-sena-text/50">No hay elementos que coincidan con la búsqueda.</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-sena-muted/35">
                    <td className="px-5 py-4 font-medium text-sena-text/70">{item.id}</td>
                    <td className="px-5 py-4 font-semibold text-sena-dark">{item.codigo}</td>
                    <td className="px-5 py-4"><div className="font-medium text-sena-text">{item.nombre}</div>{item.marca ? <div className="text-xs text-sena-text/45">{item.marca}</div> : null}</td>
                    <td className="px-5 py-4 text-sena-text/70">{categoryNameBySubcategory(item.idSubcategoria)}</td>
                    <td className="px-5 py-4 text-sena-text/70">{item.subcategoria?.nombre ?? '—'}</td>
                    <td className="px-5 py-4"><div className="text-sena-text/75">{bodegaNameByStand(item.idStand)}</div><div className="text-xs text-sena-text/45">{item.stand?.nombre ?? '—'}</div></td>
                    <td className="px-5 py-4 font-medium text-sena-text">{item.cantidad} {item.unidadMedida?.abreviatura ?? ''}</td>
                    <td className="px-5 py-4"><StatusPill active={item.estado} /></td>
                    <td className="px-5 py-4 text-right"><button type="button" onClick={() => openEdit(item)} className="inline-flex size-9 items-center justify-center rounded-lg text-sena-dark hover:bg-sena-muted" aria-label={`Editar ${item.nombre}`}><EditIcon /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {modalOpen ? (
        <Modal title={editingId ? 'Editar elemento' : 'Nuevo elemento'} description="Los datos se guardan directamente en el inventario del backend." onClose={() => !saving && setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="elemento-nombre" label="Nombre *" value={form.nombre} onChange={(event) => updateForm('nombre', event.target.value)} required />
              <TextField id="elemento-codigo" label="Código *" value={form.codigo} onChange={(event) => updateForm('codigo', event.target.value)} required />
              <TextField id="elemento-marca" label="Marca" value={form.marca ?? ''} onChange={(event) => updateForm('marca', event.target.value)} />
              <TextField id="elemento-cantidad" label="Cantidad *" type="number" min="0" step="any" value={form.cantidad} onChange={(event) => updateForm('cantidad', Number(event.target.value))} required />

              <SelectField id="elemento-categoria" label="Categoría *" value={categoryId} onChange={(value) => {
                setCategoryId(Number(value))
                updateForm('idSubcategoria', 0)
              }} options={categories.filter((item) => item.estado).map((item) => ({ value: item.id, label: item.nombre }))} required />

              <SelectField id="elemento-subcategoria" label="Subcategoría *" value={form.idSubcategoria} onChange={(value) => updateForm('idSubcategoria', Number(value))} options={subcategories.filter((item) => item.estado && item.idCategoria === categoryId).map((item) => ({ value: item.id, label: item.nombre }))} required />
              <SelectField id="elemento-bodega" label="Bodega *" value={bodegaId} onChange={(value) => {
                const nextBodegaId = Number(value)
                setBodegaId(nextBodegaId)
                const firstStand = stands.find((stand) => stand.idBodega === nextBodegaId && stand.estado)
                updateForm('idStand', firstStand?.id ?? 0)
              }} options={bodegas.filter((item) => item.estado).map((item) => ({ value: item.id_bodega ?? item.id, label: item.nombre }))} required />
              <SelectField id="elemento-stand" label="Stand *" value={form.idStand} onChange={(value) => updateForm('idStand', Number(value))} options={stands.filter((item) => item.estado && item.idBodega === bodegaId).map((item) => ({ value: item.id, label: item.nombre }))} required />
              <SelectField id="elemento-unidad" label="Unidad de medida *" value={form.idUnidadMedida} onChange={(value) => updateForm('idUnidadMedida', Number(value))} options={unidades.filter((item) => item.estado).map((item) => ({ value: item.id, label: `${item.nombre} (${item.abreviatura})` }))} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="elemento-url" label="URL de fotografía" type="url" value={form.urlFotografia ?? ''} onChange={(event) => updateForm('urlFotografia', event.target.value)} placeholder="https://..." />
              <label className="flex items-center gap-3 rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text">
                <input type="checkbox" checked={form.estado} onChange={(event) => updateForm('estado', event.target.checked)} className="size-4 accent-sena" />
                Elemento activo
              </label>
            </div>

            <div>
              <label htmlFor="elemento-descripcion" className="text-sm font-medium text-sena-text/75">Descripción técnica</label>
              <textarea id="elemento-descripcion" value={form.descripcion ?? ''} onChange={(event) => updateForm('descripcion', event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20" />
            </div>

            <div className="flex justify-end gap-3 border-t border-sena-text/8 pt-5">
              <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear elemento'}</Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppLayout>
  )
}

function selectedCategoryId(item: ElementoApi, subcategories: SubcategoryApi[]) {
  return subcategories.find((subcategory) => subcategory.id === item.idSubcategoria)?.idCategoria ?? 0
}


function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
}: {
  id: string
  label: string
  value: number
  onChange: (value: string) => void
  options: Array<{ value: number; label: string }>
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-sena-text/75">{label}</label>
      <select id={id} value={value || ''} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required} className="h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20 disabled:cursor-not-allowed disabled:opacity-60">
        <option value="">Selecciona...</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  )
}
