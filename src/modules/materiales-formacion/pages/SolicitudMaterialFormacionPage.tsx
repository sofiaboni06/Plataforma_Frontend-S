import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AppLayout from '@/shared/components/layout/AppLayout'
import { DeliverIcon, PlusIcon } from '@/shared/components/icons/AppIcons'
import { StatusPill } from '@/shared/components/ResourceBoard'
import Button from '@/shared/components/ui/Button'
import Modal from '@/shared/components/ui/Modal'
import TextField from '@/shared/components/ui/TextField'
import {
  ErrorBanner,
  PageHeader,
  TableCard,
  TableEmpty,
  TableHeader,
  TableLoading,
  TablePagination,
  TableRow,
  tableClass,
  tableColumns,
} from '@/shared/components/DataTable'
import { ApiError } from '@/shared/lib/api'
import { usePagination } from '@/shared/lib/table'
import {
  createSolicitudFormacion,
  getCatalogoElementos,
  getMaterialesFormacion,
  getProgramasOpciones,
  getSolicitudesFormacion,
} from '@/modules/materiales-formacion/data/materialFormacion'
import type {
  MaterialFormacionApi,
  MaterialFormacionElemento,
  MaterialFormacionPrograma,
  SolicitudMaterialFormacionApi,
  SolicitudMaterialFormacionEstado,
} from '@/modules/materiales-formacion/types'

const selectClass =
  'h-11 w-full rounded-lg bg-sena-muted px-3.5 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20'

const estadoPill: Record<
  SolicitudMaterialFormacionEstado,
  { tone: 'ok' | 'warn' | 'danger'; label: string }
> = {
  pendiente: { tone: 'warn', label: 'Pendiente' },
  atendida: { tone: 'ok', label: 'Atendida' },
  cancelada: { tone: 'danger', label: 'Cancelada' },
}

type SolicitudForm = {
  idPrograma: number
  idMaterial: number
  cantidad: string
  observaciones: string
}

const emptyForm: SolicitudForm = {
  idPrograma: 0,
  idMaterial: 0,
  cantidad: '',
  observaciones: '',
}

function fechaCorta(valor?: string | null) {
  if (!valor) return '—'
  const date = new Date(valor)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

/*
 * Solicitud de materiales de formación: pantalla propia del módulo, con el
 * mismo formato que la lista de materiales. La tabla lista las solicitudes
 * registradas (GET /materiales-formacion/solicitudes) y el formulario se abre
 * con «Solicitar material»: el instructor elige el programa (ficha) y un
 * material de la lista maestra de ese programa e indica la cantidad. No usa
 * obras, entregas ni devoluciones de inventario.
 */
export default function SolicitudMaterialFormacionPage() {
  const [programas, setProgramas] = useState<MaterialFormacionPrograma[]>([])
  const [materiales, setMateriales] = useState<MaterialFormacionApi[]>([])
  const [catalogoElementos, setCatalogoElementos] = useState<MaterialFormacionElemento[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudMaterialFormacionApi[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<SolicitudForm>(emptyForm)

  useEffect(() => {
    document.title = 'Solicitud de materiales | SENA'

    Promise.all([
      getSolicitudesFormacion(),
      getProgramasOpciones(),
      getMaterialesFormacion(),
      getCatalogoElementos().catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 403) return []
        throw caught
      }),
    ])
      .then(([solicitudData, programaData, materialData, elementoData]) => {
        setSolicitudes(solicitudData)
        setProgramas(programaData)
        setMateriales(materialData)
        setCatalogoElementos(elementoData)
        setLoading(false)
      })
      .catch((caught: unknown) => {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'No se pudieron cargar las solicitudes de materiales de formación.',
        )
        setLoading(false)
      })
  }, [])

  /** Solo materiales activos de programas activos: lo demás no admite pedidos. */
  const materialesSolicitables = useMemo(
    () =>
      materiales.filter(
        (material) =>
          material.estado && (material.programa ? material.programa.estado !== false : true),
      ),
    [materiales],
  )

  const materialOptions = useMemo(() => {
    const delPrograma = materialesSolicitables.filter(
      (material) => String(material.idPrograma) === String(form.idPrograma),
    )

    return delPrograma.map((material) => ({
      value: material.id,
      label: material.elemento
        ? material.elemento.codigo
          ? `${material.elemento.nombre} — ${material.elemento.codigo}`
          : material.elemento.nombre
        : `Material ${material.id}`,
    }))
  }, [materialesSolicitables, form.idPrograma])

  const materialSeleccionado = useMemo(
    () => materiales.find((material) => material.id === form.idMaterial) ?? null,
    [materiales, form.idMaterial],
  )

  /** Marca y tipo: datos del propio elemento, tomados del catálogo global. */
  const elementoSeleccionado = useMemo(() => {
    if (!materialSeleccionado) return null
    return (
      catalogoElementos.find((elemento) => elemento.id === materialSeleccionado.idElemento) ??
      materialSeleccionado.elemento
    )
  }, [materialSeleccionado, catalogoElementos])

  const cantidadValida = /^\d+$/.test(form.cantidad) && Number(form.cantidad) > 0

  const { pageRows, totalPages, currentPage, from, to, total } = usePagination(solicitudes, page)

  function openCreate() {
    setForm(emptyForm)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const idMaterial = form.idMaterial
    if (!Number.isInteger(idMaterial) || idMaterial <= 0) {
      setError('Selecciona el material que necesitas.')
      return
    }

    if (!cantidadValida) {
      setError('La cantidad solicitada debe ser un número entero mayor que cero.')
      return
    }

    setSaving(true)
    setError(null)

    const observacion = form.observaciones.trim()

    try {
      const solicitud = await createSolicitudFormacion({
        idMaterial,
        cantidadSolicitada: Number(form.cantidad),
        ...(observacion ? { observaciones: observacion } : {}),
      })

      // Se recarga desde el backend: la tabla refleja lo guardado sin
      // recargar la aplicación.
      const actualizadas = await getSolicitudesFormacion()
      setSolicitudes(actualizadas)
      setPage(1)
      setModalOpen(false)
      setNotice(
        `Solicitud registrada: ${
          solicitud.elemento?.nombre ?? 'material'
        } × ${solicitud.cantidadSolicitada} para ${solicitud.programa?.nombre ?? 'el programa'}.`,
      )
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'No se pudo registrar la solicitud.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Solicitud de materiales de formación" showCenterBanner={false}>
      <PageHeader
        icon={<DeliverIcon />}
        title="Solicitud de materiales de formación"
        description="Solicita el material que necesitas para tus programas: elige el programa (ficha) y uno de los materiales de su lista, e indica la cantidad. Este flujo es propio de Materiales de Formación y no usa obras, entregas ni devoluciones de inventario."
        action={
          <Button type="button" icon={<PlusIcon className="size-4" />} onClick={openCreate}>
            Solicitar material
          </Button>
        }
      />

      {notice ? (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error && !modalOpen ? <ErrorBanner message={error} onClose={() => setError(null)} /> : null}

      <TableCard>
        {loading ? (
          <TableLoading label="Cargando solicitudes..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr className="border-b border-sena-dark/8 bg-sena-muted/45">
                    <TableHeader width={tableColumns.name}>Material</TableHeader>
                    <TableHeader width={tableColumns.relation}>Programa</TableHeader>
                    <TableHeader align="center" width={tableColumns.count}>
                      Cantidad
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.status}>
                      Estado
                    </TableHeader>
                    <TableHeader align="center" width={tableColumns.relation}>
                      Fecha
                    </TableHeader>
                    <TableHeader width={tableColumns.relation}>Solicitante</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <TableEmpty colSpan={6}>
                      Aún no hay solicitudes de materiales de formación.
                    </TableEmpty>
                  ) : (
                    pageRows.map((solicitud) => {
                      const pill = estadoPill[solicitud.estado] ?? estadoPill.pendiente

                      return (
                        <TableRow key={solicitud.id}>
                          <td className="px-5 py-4">
                            <p className="truncate font-semibold text-sena-text">
                              {solicitud.elemento?.nombre ?? 'Material no disponible'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-sena-text/45">
                              {[
                                solicitud.elemento?.codigo,
                                solicitud.elemento?.marca,
                                solicitud.elemento?.unidadMedida?.abreviatura,
                              ]
                                .filter(Boolean)
                                .join(' · ') || 'Sin datos del elemento'}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="truncate font-medium text-sena-dark">
                              {solicitud.programa?.nombre ?? '—'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-sena-text/45">
                              {solicitud.programa ? solicitud.programa.codigo : 'Sin programa'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="font-semibold text-sena-dark">
                              {solicitud.cantidadSolicitada}
                            </span>
                            <span className="ml-1 text-xs text-sena-text/55">
                              {solicitud.elemento?.unidadMedida?.abreviatura ?? ''}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                          </td>
                          <td className="px-5 py-4 text-center text-sm text-sena-text/70">
                            {fechaCorta(solicitud.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-sm text-sena-text/70">
                            {solicitud.solicitante ?? '—'}
                          </td>
                        </TableRow>
                      )
                    })
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
              total={total}
              noun="solicitudes"
            />
          </>
        )}
      </TableCard>

      {modalOpen ? (
        <Modal
          title="Nueva solicitud de material"
          description="Elige el programa (ficha) y uno de los materiales de su lista, e indica cuántas unidades necesitas."
          onClose={() => !saving && setModalOpen(false)}
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            {programas.length === 0 ? (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No hay programas de formación disponibles para solicitar materiales.
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="solicitud-programa" className="form-label">
                Programa de formación (ficha) *
              </label>
              <select
                id="solicitud-programa"
                value={form.idPrograma || ''}
                onChange={(event) =>
                  // El material pertenece a un programa: al cambiar se limpia.
                  setForm((current) => ({
                    ...current,
                    idPrograma: Number(event.target.value),
                    idMaterial: 0,
                  }))
                }
                required
                className={selectClass}
              >
                <option value="">Selecciona...</option>
                {programas.map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    {programa.codigo} · {programa.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="solicitud-material" className="form-label">
                Material de formación *
              </label>
              <select
                id="solicitud-material"
                value={form.idMaterial || ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, idMaterial: Number(event.target.value) }))
                }
                required
                disabled={!form.idPrograma}
                className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="">
                  {!form.idPrograma
                    ? 'Primero selecciona un programa...'
                    : materialOptions.length === 0
                      ? 'Este programa aún no tiene materiales registrados...'
                      : 'Selecciona...'}
                </option>
                {materialOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.idPrograma && materialOptions.length === 0 ? (
                <p className="text-xs text-sena-text/50">
                  Un administrador debe registrar primero los materiales del programa en «Lista de
                  materiales».
                </p>
              ) : null}
            </div>

            {materialSeleccionado ? (
              <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-sena-muted px-4 py-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-sena-text/55">Tipo de material</dt>
                  <dd className="font-medium text-sena-text">
                    {elementoSeleccionado?.clasificacion?.nombre ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sena-text/55">Marca</dt>
                  <dd className="font-medium text-sena-text">
                    {elementoSeleccionado?.marca || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sena-text/55">Código</dt>
                  <dd className="font-medium text-sena-text">
                    {materialSeleccionado.elemento?.codigo || elementoSeleccionado?.codigo || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sena-text/55">Cantidad base del programa</dt>
                  <dd className="font-medium text-sena-text">
                    {materialSeleccionado.cantidadBase}{' '}
                    {materialSeleccionado.elemento?.unidadMedida?.abreviatura ?? ''}
                  </dd>
                </div>
              </dl>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <TextField
                id="solicitud-cantidad"
                label="Cantidad solicitada *"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={form.cantidad}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cantidad: event.target.value }))
                }
                placeholder="5"
                required
              />
              {form.cantidad !== '' && !cantidadValida ? (
                <p className="text-xs text-red-600">
                  La cantidad debe ser un número entero mayor que cero.
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="solicitud-observaciones"
                className="text-sm font-medium text-sena-text/75"
              >
                Observaciones
              </label>
              <textarea
                id="solicitud-observaciones"
                value={form.observaciones}
                onChange={(event) =>
                  setForm((current) => ({ ...current, observaciones: event.target.value }))
                }
                rows={3}
                maxLength={1000}
                placeholder="Aclaraciones del material solicitado..."
                className="mt-1.5 w-full rounded-lg bg-sena-muted px-3.5 py-3 text-sm text-sena-text outline-none focus:bg-white focus:ring-2 focus:ring-sena/20"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-sena-text/8 pt-5">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || programas.length === 0}>
                {saving ? 'Guardando...' : 'Guardar solicitud'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppLayout>
  )
}
