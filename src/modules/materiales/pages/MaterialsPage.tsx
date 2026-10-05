import { useEffect, useMemo, useState } from 'react'

import AppLayout from '@/shared/components/layout/AppLayout'
import ResourceBoard, { StatusPill } from '@/shared/components/ResourceBoard'
import { InventoryIcon } from '@/shared/components/icons/AppIcons'
import { MATERIAL_ROWS } from '@/modules/materiales/data/rows'
import { api } from '@/shared/lib/api'
import { useAuth } from '@/modules/auth/context/auth'
import type { ElementoApi } from '@/modules/inventario/types/elemento'

const TABS = ['Materiales', 'Solicitudes', 'Préstamos', 'Devoluciones']

type TipoSolicitud = 'equipo' | 'material'

type Obra = {
  id: number
  nombre: string
  lugar?: string | null
  estado?: boolean
}

type Solicitud = {
  id: number
  codigoSolicitud: string
  idObra: number
  idElemento: number
  idUsuario: number
  idUsuarioEntrega?: number | null
  cantidad: number
  ficha?: string | null
  estado: 'pendiente' | 'entregado' | 'devuelto'
  estadoElemento?: string | null
  fecha?: string | null
  fechaEntrega?: string | null
  fechaDevolucion?: string | null
  observacion?: string | null
  obra?: {
    id: number
    nombre: string
    lugar?: string | null
  } | null
  elemento?: {
    id: number
    nombre: string
    codigo: string
    cantidad: number
  } | null
  usuario?: {
    id: number
    nombres: string
    apellidos: string
    email: string
  } | null
}

type FormSolicitud = {
  idObra: string
  idElemento: string
  cantidad: string
  ficha: string
  observacion: string
}

const EMPTY_FORM: FormSolicitud = {
  idObra: '',
  idElemento: '',
  cantidad: '1',
  ficha: '',
  observacion: '',
}

function getTone(
  estado: string,
): 'ok' | 'warn' | 'danger' {
  if (estado === 'entregado') return 'ok'
  if (estado === 'devuelto') return 'danger'
  return 'warn'
}

function generarCodigo(tipo: TipoSolicitud) {
  const prefijo = tipo === 'equipo' ? 'SOL-EQ' : 'SOL-MAT'
  return `${prefijo}-${Date.now()}`
}

export default function MaterialsPage() {
  const { user, isAdmin } = useAuth()

  const permissions = user?.permissions ?? []

  const canCreateEquipo =
    isAdmin || permissions.includes('solicitud_equipo.crear')

  const canDeliverEquipo =
    isAdmin || permissions.includes('solicitud_equipo.entregar')

  const canCreateMaterial =
    isAdmin || permissions.includes('solicitud_material.crear')

  const canDeliverMaterial =
    isAdmin || permissions.includes('solicitud_material.entregar')

  const [tab, setTab] = useState(TABS[0])
  const [search, setSearch] = useState('')

  const [tipoSolicitud, setTipoSolicitud] =
    useState<TipoSolicitud>('equipo')

  const [obras, setObras] = useState<Obra[]>([])
  const [elementos, setElementos] = useState<ElementoApi[]>([])

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])

  const [form, setForm] = useState<FormSolicitud>(EMPTY_FORM)

  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false)
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [entregandoId, setEntregandoId] = useState<number | null>(null)

  const [modalOpen, setModalOpen] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  /*
   * Materiales originales de la pantalla.
   */
  const rows = useMemo(
    () =>
      MATERIAL_ROWS.filter((row) =>
        `${row.id} ${row.name} ${row.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  )

  /*
   * Elementos que pueden solicitarse.
   *
   * Equipo = devolutivo
   * Material = consumo
   */
  const elementosDisponibles = useMemo(() => {
    const caracter =
      tipoSolicitud === 'equipo' ? 'devolutivo' : 'consumo'

    return elementos.filter(
      (elemento) =>
        elemento.estado === true &&
        elemento.clasificacion?.nombre?.toLowerCase() === caracter,
    )
  }, [elementos, tipoSolicitud])

  /*
   * Elemento seleccionado en el formulario.
   */
  const elementoSeleccionado = useMemo(() => {
    const id = Number(form.idElemento)

    return elementosDisponibles.find(
      (elemento) => elemento.id === id,
    )
  }, [elementosDisponibles, form.idElemento])

  /*
   * Cargar obras y elementos cuando entramos a Solicitudes.
   */
  useEffect(() => {
    if (tab !== 'Solicitudes') return

    let cancelled = false

    async function cargarCatalogos() {
      setLoadingCatalogos(true)
      setError(null)

      try {
        const [obrasResponse, elementosResponse] =
          await Promise.all([
            api<Obra[]>('/obras'),
            api<ElementoApi[]>('/inventario/elementos'),
          ])

        if (cancelled) return

        setObras(obrasResponse)
        setElementos(elementosResponse)
      } catch (err) {
        if (cancelled) return

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las obras y elementos.',
        )
      } finally {
        if (!cancelled) {
          setLoadingCatalogos(false)
        }
      }
    }

    void cargarCatalogos()

    return () => {
      cancelled = true
    }
  }, [tab])

  /*
   * Cargar solicitudes pendientes.
   *
   * El backend decide cuáles puede ver cada usuario
   * según sus permisos.
   */
  useEffect(() => {
    if (tab !== 'Solicitudes') return

    let cancelled = false

    async function cargarSolicitudes() {
      setLoadingSolicitudes(true)

      try {
        const resultados: Solicitud[] = []

        if (canDeliverEquipo || canCreateEquipo) {
          try {
            const equipo = await api<Solicitud[]>(
              '/solicitudes-equipo?estado=pendiente',
            )

            resultados.push(...equipo)
          } catch {
            // Si no tiene permiso para consultar equipo,
            // no detenemos la pantalla.
          }
        }

        if (canDeliverMaterial || canCreateMaterial) {
          try {
            const material = await api<Solicitud[]>(
              '/solicitudes-material?estado=pendiente',
            )

            resultados.push(...material)
          } catch {
            // Si no tiene permiso para consultar material,
            // no detenemos la pantalla.
          }
        }

        if (!cancelled) {
          setSolicitudes(resultados)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar las solicitudes.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingSolicitudes(false)
        }
      }
    }

    void cargarSolicitudes()

    return () => {
      cancelled = true
    }
  }, [
    tab,
    canDeliverEquipo,
    canCreateEquipo,
    canDeliverMaterial,
    canCreateMaterial,
  ])

  function abrirFormulario(tipo: TipoSolicitud) {
    setTipoSolicitud(tipo)
    setForm(EMPTY_FORM)
    setError(null)
    setNotice(null)
    setModalOpen(true)
  }

  function cerrarFormulario() {
    if (saving) return

    setModalOpen(false)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function crearSolicitud() {
    setError(null)
    setNotice(null)

    const idObra = Number(form.idObra)
    const idElemento = Number(form.idElemento)
    const cantidad = Number(form.cantidad)

    if (!idObra) {
      setError('Selecciona una obra.')
      return
    }

    if (!idElemento) {
      setError('Selecciona un elemento.')
      return
    }

    if (!cantidad || cantidad <= 0 || !Number.isInteger(cantidad)) {
      setError('La cantidad debe ser un número entero mayor que cero.')
      return
    }

    if (!elementoSeleccionado) {
      setError('El elemento seleccionado no es válido.')
      return
    }

    /*
     * Esta es una validación visual.
     *
     * El backend también vuelve a validar la disponibilidad
     * para evitar reservas por encima del stock.
     */
    if (cantidad > Number(elementoSeleccionado.cantidad)) {
      setError(
        `No puedes solicitar ${cantidad}. Solo hay ${elementoSeleccionado.cantidad} disponibles.`,
      )
      return
    }

    const payload = {
      codigoSolicitud: generarCodigo(tipoSolicitud),
      idObra,
      idElemento,
      cantidad,
      ...(form.ficha.trim()
        ? { ficha: form.ficha.trim() }
        : {}),
      ...(form.observacion.trim()
        ? { observacion: form.observacion.trim() }
        : {}),
    }

    setSaving(true)

    try {
      if (tipoSolicitud === 'equipo') {
        await api('/solicitudes-equipo', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/solicitudes-material', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setModalOpen(false)
      setForm(EMPTY_FORM)

      setNotice(
        tipoSolicitud === 'equipo'
          ? 'Solicitud de equipo registrada correctamente.'
          : 'Solicitud de material registrada correctamente.',
      )

      /*
       * Importante:
       * aquí NO disminuimos el stock.
       *
       * El backend solamente descuenta cuando
       * administración entrega la solicitud.
       */
      await cargarDatosDespuesDeAccion()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar la solicitud.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function entregarSolicitud(solicitud: Solicitud) {
    setError(null)
    setNotice(null)

    const confirmar = window.confirm(
      `¿Confirmas la entrega de ${solicitud.cantidad} unidad(es) de ${
        solicitud.elemento?.nombre ?? 'este elemento'
      }?`,
    )

    if (!confirmar) return

    const esEquipo =
      solicitudesEquipoIds.has(solicitud.id)

    setEntregandoId(solicitud.id)

    try {
      if (esEquipo) {
        await api(
          `/solicitudes-equipo/${solicitud.id}/entregar`,
          {
            method: 'PATCH',
          },
        )

        setNotice('Equipo entregado correctamente.')
      } else {
        await api(
          `/solicitudes-material/${solicitud.id}/entregar`,
          {
            method: 'PATCH',
          },
        )

        setNotice('Material entregado correctamente.')
      }

      await cargarDatosDespuesDeAccion()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo entregar la solicitud.',
      )
    } finally {
      setEntregandoId(null)
    }
  }

  /*
   * IDs de solicitudes de equipo.
   *
   * El backend usa IDs independientes para equipo y material,
   * por eso necesitamos saber a qué endpoint pertenece cada fila.
   */
  const solicitudesEquipoIds = useMemo(() => {
    const ids = new Set<number>()

    /*
     * Solo podemos distinguirlas consultando las dos listas.
     * La información se mantiene en los arrays auxiliares.
     */
    solicitudesEquipoActual.forEach((item) => ids.add(item.id))

    return ids
  }, [])

  /*
   * Estas referencias se actualizan al cargar solicitudes.
   */
  const [solicitudesEquipoActual, setSolicitudesEquipoActual] =
    useState<Solicitud[]>([])

  const [, setSolicitudesMaterialActual] =
    useState<Solicitud[]>([])

  async function cargarDatosDespuesDeAccion() {
    try {
      const resultadosEquipo: Solicitud[] = []
      const resultadosMaterial: Solicitud[] = []

      if (canDeliverEquipo || canCreateEquipo) {
        try {
          const equipo = await api<Solicitud[]>(
            '/solicitudes-equipo?estado=pendiente',
          )

          resultadosEquipo.push(...equipo)
        } catch {
          // Sin permiso: no mostramos equipo.
        }
      }

      if (canDeliverMaterial || canCreateMaterial) {
        try {
          const material = await api<Solicitud[]>(
            '/solicitudes-material?estado=pendiente',
          )

          resultadosMaterial.push(...material)
        } catch {
          // Sin permiso: no mostramos material.
        }
      }

      setSolicitudesEquipoActual(resultadosEquipo)
      setSolicitudesMaterialActual(resultadosMaterial)
      setSolicitudes([
        ...resultadosEquipo,
        ...resultadosMaterial,
      ])

      /*
       * Volvemos a consultar elementos para que el stock
       * que aparece en pantalla sea el real.
       */
      try {
        const nuevosElementos = await api<ElementoApi[]>(
          '/inventario/elementos',
        )

        setElementos(nuevosElementos)
      } catch {
        // No detenemos la pantalla si falla solo esta recarga.
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron actualizar las solicitudes.',
      )
    }
  }

  /*
   * Cargar inicialmente las listas separadas para poder saber
   * qué endpoint corresponde a cada solicitud.
   */
  useEffect(() => {
    if (tab !== 'Solicitudes') return

    let cancelled = false

    async function cargarListasSeparadas() {
      try {
        const equipoPromise =
          canDeliverEquipo || canCreateEquipo
            ? api<Solicitud[]>(
                '/solicitudes-equipo?estado=pendiente',
              ).catch(() => [])
            : Promise.resolve([])

        const materialPromise =
          canDeliverMaterial || canCreateMaterial
            ? api<Solicitud[]>(
                '/solicitudes-material?estado=pendiente',
              ).catch(() => [])
            : Promise.resolve([])

        const [equipo, material] = await Promise.all([
          equipoPromise,
          materialPromise,
        ])

        if (cancelled) return

        setSolicitudesEquipoActual(equipo)
        setSolicitudesMaterialActual(material)
        setSolicitudes([...equipo, ...material])
      } catch {
        // La carga principal ya maneja el estado de error.
      }
    }

    void cargarListasSeparadas()

    return () => {
      cancelled = true
    }
  }, [
    tab,
    canDeliverEquipo,
    canCreateEquipo,
    canDeliverMaterial,
    canCreateMaterial,
  ])

  /*
   * Si el usuario no tiene permisos para crear ni entregar,
   * ocultamos la parte de solicitudes.
   */
  const puedeUsarSolicitudes =
    canCreateEquipo ||
    canDeliverEquipo ||
    canCreateMaterial ||
    canDeliverMaterial

  return (
    <AppLayout title="Material de Formación">
      {tab === 'Materiales' && (
        <ResourceBoard
          icon={<InventoryIcon />}
          title="Material de Formación"
          subtitle="Administra guías, kits y material de apoyo del centro."
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar material..."
          addLabel="Nuevo material"
          columns={[
            {
              key: 'id',
              label: 'ID',
              render: (row) => row.id,
            },
            {
              key: 'name',
              label: 'Nombre',
              render: (row) => row.name,
            },
            {
              key: 'category',
              label: 'Categoría',
              render: (row) => row.category,
            },
            {
              key: 'stock',
              label: 'Stock',
              render: (row) => row.stock,
            },
            {
              key: 'status',
              label: 'Estado',
              render: (row) => (
                <StatusPill tone="ok">
                  {row.status}
                </StatusPill>
              ),
            },
          ]}
          rows={rows}
          rowKey={(row) => row.id}
          footer={`Mostrando ${rows.length} registros`}
        />
      )}

      {tab !== 'Materiales' && (
        <div className="space-y-6">
          {tab === 'Solicitudes' && puedeUsarSolicitudes && (
            <>
              <div className="rounded-3xl border border-sena-line bg-white p-6 shadow-hairline">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-sena-dark">
                      Solicitudes de equipos y materiales
                    </h2>

                    <p className="mt-1 text-sm text-sena-text-soft">
                      Solicita equipos devolutivos o materiales de consumo
                      para una obra.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {canCreateEquipo && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario('equipo')}
                        className="rounded-2xl bg-sena px-5 py-3 text-sm font-semibold text-white shadow-brand hover:bg-sena-bright"
                      >
                        Solicitar equipo
                      </button>
                    )}

                    {canCreateMaterial && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario('material')}
                        className="rounded-2xl border border-sena-line bg-white px-5 py-3 text-sm font-semibold text-sena-dark hover:bg-sena-soft"
                      >
                        Solicitar material
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {notice && (
                <div className="rounded-2xl border border-sena-ok-line bg-sena-active-soft px-5 py-4 text-sm font-semibold text-sena-ok-text">
                  {notice}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-sena-line bg-sena-off-soft px-5 py-4 text-sm font-semibold text-sena-text">
                  {error}
                </div>
              )}

              {(canDeliverEquipo || canDeliverMaterial) && (
                <div className="rounded-3xl border border-sena-line bg-white shadow-hairline">
                  <div className="border-b border-sena-hairline p-6">
                    <h2 className="text-lg font-bold text-sena-dark">
                      Solicitudes pendientes
                    </h2>

                    <p className="mt-1 text-sm text-sena-text-soft">
                      Entrega los elementos solicitados. El stock disminuye
                      únicamente al realizar la entrega.
                    </p>
                  </div>

                  {loadingSolicitudes ? (
                    <div className="p-8 text-center text-sm text-sena-text-soft">
                      Cargando solicitudes...
                    </div>
                  ) : solicitudes.length === 0 ? (
                    <div className="p-8 text-center text-sm text-sena-text-soft">
                      No hay solicitudes pendientes.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-250 text-sm">
                        <thead>
                          <tr className="border-b border-sena-hairline bg-sena-soft/85">
                            <th className="px-5 py-4 text-left font-semibold">
                              Solicitud
                            </th>
                            <th className="px-5 py-4 text-left font-semibold">
                              Tipo
                            </th>
                            <th className="px-5 py-4 text-left font-semibold">
                              Obra
                            </th>
                            <th className="px-5 py-4 text-left font-semibold">
                              Elemento
                            </th>
                            <th className="px-5 py-4 text-center font-semibold">
                              Cantidad
                            </th>
                            <th className="px-5 py-4 text-left font-semibold">
                              Ficha
                            </th>
                            <th className="px-5 py-4 text-left font-semibold">
                              Estado
                            </th>
                            <th className="px-5 py-4 text-center font-semibold">
                              Acción
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {solicitudes.map((solicitud) => {
                            const esEquipo =
                              solicitudesEquipoIds.has(solicitud.id)

                            const puedeEntregar = esEquipo
                              ? canDeliverEquipo
                              : canDeliverMaterial

                            if (!puedeEntregar) return null

                            return (
                              <tr
                                key={`${esEquipo ? 'equipo' : 'material'}-${solicitud.id}`}
                                className="border-b border-sena-hairline"
                              >
                                <td className="px-5 py-4 font-semibold text-sena-dark">
                                  {solicitud.codigoSolicitud}
                                </td>

                                <td className="px-5 py-4">
                                  {esEquipo
                                    ? 'Equipo'
                                    : 'Material'}
                                </td>

                                <td className="px-5 py-4">
                                  {solicitud.obra?.nombre ?? '—'}
                                </td>

                                <td className="px-5 py-4">
                                  <div className="font-semibold text-sena-dark">
                                    {solicitud.elemento?.nombre ?? '—'}
                                  </div>

                                  <div className="text-xs text-sena-text-soft">
                                    {solicitud.elemento?.codigo ?? ''}
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-center font-bold">
                                  {solicitud.cantidad}
                                </td>

                                <td className="px-5 py-4">
                                  {solicitud.ficha || '—'}
                                </td>

                                <td className="px-5 py-4">
                                  <StatusPill
                                    tone={getTone(solicitud.estado)}
                                  >
                                    {solicitud.estado}
                                  </StatusPill>
                                </td>

                                <td className="px-5 py-4 text-center">
                                  <button
                                    type="button"
                                    disabled={
                                      entregandoId === solicitud.id
                                    }
                                    onClick={() =>
                                      void entregarSolicitud(solicitud)
                                    }
                                    className="rounded-xl bg-sena px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {entregandoId === solicitud.id
                                      ? 'Entregando...'
                                      : 'Entregar'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {!canDeliverEquipo &&
                !canDeliverMaterial &&
                (canCreateEquipo || canCreateMaterial) && (
                  <div className="rounded-3xl border border-sena-line bg-white p-6 shadow-hairline">
                    <h2 className="text-lg font-bold text-sena-dark">
                      Mis solicitudes
                    </h2>

                    <p className="mt-1 text-sm text-sena-text-soft">
                      Tus solicitudes quedan pendientes hasta que
                      administración realice la entrega.
                    </p>
                  </div>
                )}
            </>
          )}

          {tab === 'Préstamos' && (
            <div className="rounded-3xl border border-sena-line bg-white p-8 shadow-hairline">
              <h2 className="text-xl font-bold text-sena-dark">
                Préstamos
              </h2>

              <p className="mt-2 text-sm text-sena-text-soft">
                Esta sección conserva el flujo de préstamos existente.
              </p>
            </div>
          )}

          {tab === 'Devoluciones' && (
            <div className="rounded-3xl border border-sena-line bg-white p-8 shadow-hairline">
              <h2 className="text-xl font-bold text-sena-dark">
                Devoluciones
              </h2>

              <p className="mt-2 text-sm text-sena-text-soft">
                Esta sección queda disponible para el flujo de
                devoluciones.
              </p>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-sena-dark">
                  {tipoSolicitud === 'equipo'
                    ? 'Solicitar equipo'
                    : 'Solicitar material'}
                </h2>

                <p className="mt-1 text-sm text-sena-text-soft">
                  Completa los datos de la solicitud.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarFormulario}
                className="rounded-xl px-3 py-2 text-lg font-bold text-sena-text-soft hover:bg-sena-soft"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {loadingCatalogos ? (
                <div className="rounded-2xl bg-sena-soft p-5 text-sm text-sena-text-soft">
                  Cargando obras y elementos...
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-sena-dark">
                      Obra *
                    </label>

                    <select
                      value={form.idObra}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          idObra: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-sena-line bg-white px-4 text-sm outline-none focus:border-sena"
                    >
                      <option value="">
                        Selecciona una obra
                      </option>

                      {obras.map((obra) => (
                        <option key={obra.id} value={obra.id}>
                          {obra.nombre}
                          {obra.lugar ? ` — ${obra.lugar}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-sena-dark">
                      {tipoSolicitud === 'equipo'
                        ? 'Equipo devolutivo *'
                        : 'Material de consumo *'}
                    </label>

                    <select
                      value={form.idElemento}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          idElemento: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-sena-line bg-white px-4 text-sm outline-none focus:border-sena"
                    >
                      <option value="">
                        Selecciona un elemento
                      </option>

                      {elementosDisponibles.map((elemento) => (
                        <option
                          key={elemento.id}
                          value={elemento.id}
                        >
                          {elemento.nombre} — {elemento.codigo} — Stock:{' '}
                          {elemento.cantidad}
                        </option>
                      ))}
                    </select>
                  </div>

                  {elementoSeleccionado && (
                    <div className="rounded-2xl border border-sena-line bg-sena-soft p-4">
                      <div className="text-sm font-semibold text-sena-dark">
                        Elemento seleccionado
                      </div>

                      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-sena-text-soft">
                            Nombre:
                          </span>{' '}
                          {elementoSeleccionado.nombre}
                        </div>

                        <div>
                          <span className="text-sena-text-soft">
                            Código:
                          </span>{' '}
                          {elementoSeleccionado.codigo}
                        </div>

                        <div>
                          <span className="text-sena-text-soft">
                            Disponible:
                          </span>{' '}
                          <strong>
                            {elementoSeleccionado.cantidad}
                          </strong>
                        </div>

                        <div>
                          <span className="text-sena-text-soft">
                            Tipo:
                          </span>{' '}
                          {tipoSolicitud === 'equipo'
                            ? 'Devolutivo'
                            : 'Consumo'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-sena-dark">
                      Cantidad *
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.cantidad}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          cantidad: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-sena-line px-4 text-sm outline-none focus:border-sena"
                    />

                    {elementoSeleccionado && (
                      <p className="mt-2 text-xs text-sena-text-soft">
                        Disponible actualmente:{' '}
                        {elementoSeleccionado.cantidad}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-sena-dark">
                      Ficha
                    </label>

                    <input
                      type="text"
                      maxLength={50}
                      value={form.ficha}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          ficha: event.target.value,
                        }))
                      }
                      placeholder="Ej. 2876543"
                      className="h-12 w-full rounded-xl border border-sena-line px-4 text-sm outline-none focus:border-sena"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-sena-dark">
                      Observación
                    </label>

                    <textarea
                      rows={4}
                      value={form.observacion}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          observacion: event.target.value,
                        }))
                      }
                      placeholder="Describe para qué necesitas el equipo o material..."
                      className="w-full rounded-xl border border-sena-line px-4 py-3 text-sm outline-none focus:border-sena"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl border border-sena-line bg-sena-off-soft px-4 py-3 text-sm font-semibold text-sena-text">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 border-t border-sena-hairline pt-5">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={cerrarFormulario}
                      className="rounded-xl border border-sena-line px-5 py-3 text-sm font-semibold text-sena-dark hover:bg-sena-soft disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={saving || loadingCatalogos}
                      onClick={() => void crearSolicitud()}
                      className="rounded-xl bg-sena px-5 py-3 text-sm font-semibold text-white shadow-brand hover:bg-sena-bright disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? 'Enviando...'
                        : 'Enviar solicitud'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}