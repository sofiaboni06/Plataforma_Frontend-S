import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AppLayout from '@/shared/components/layout/AppLayout'
import { getStand } from '@/modules/inventario/data/bodega'
import type { StandApi } from '@/modules/inventario/types/bodega'

export default function ViewStandPage() {
  const navigate = useNavigate()

  const { id_bodega, id_stand } = useParams<{
    id_bodega: string
    id_stand: string
  }>()

  const [stand, setStand] = useState<StandApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id_stand) {
      setError('No se encontró el stand.')
      setLoading(false)
      return
    }

    async function loadStand() {
  if (!id_stand) {
    setError('No se encontró el stand.')
    setLoading(false)
    return
  }

  try {
    setLoading(true)
    setError('')

    const result = await getStand(id_stand)

        if (!result) {
          setError('No se encontró el stand.')
          return
        }

        setStand(result)
      } catch (err) {
        console.error(err)

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el stand.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadStand()
  }, [id_stand])

  if (loading) {
    return (
      <AppLayout title="Detalle del stand">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-sena-text/60 shadow-sm ring-1 ring-sena-dark/8">
            Cargando stand...
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!stand) {
    return (
      <AppLayout title="Detalle del stand">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-sena-dark/8">
            <p className="text-sm text-red-600">
              {error || 'No se encontró el stand.'}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  id_bodega
                    ? `/inventario/bodegas/${id_bodega}`
                    : '/inventario/bodegas',
                )
              }
              className="mt-5 rounded-lg bg-sena px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sena-dark"
            >
              Volver a la bodega
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const nombreStand = stand.nombre || `Stand ${stand.idStand ?? stand.id}`

  const codigoStand = stand.idStand
    ? `S-${String(stand.idStand).padStart(3, '0')}`
    : `S-${String(stand.id).padStart(3, '0')}`

  return (
    <AppLayout title="Detalle del stand">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/inicio"
            className="text-sena-text/50 transition hover:text-sena"
          >
            Inicio
          </Link>

          <span className="text-sena-text/30">/</span>

          <Link
            to="/inventario/bodegas"
            className="text-sena-text/50 transition hover:text-sena"
          >
            Bodegas
          </Link>

          <span className="text-sena-text/30">/</span>

          <Link
            to={
              id_bodega
                ? `/inventario/bodegas/${id_bodega}`
                : '/inventario/bodegas'
            }
            className="text-sena-text/50 transition hover:text-sena"
          >
            Bodega
          </Link>

          <span className="text-sena-text/30">/</span>

          <span className="font-medium text-sena-text">
            {nombreStand}
          </span>
        </nav>

        {/* Header */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sena-dark/8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sena/10 text-sena">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5 12 3l9 4.5M3 7.5v9L12 21l9-4.5v-9M3 7.5 12 12l9-4.5M12 12v9"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 5.25 16.5 9.75"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-medium text-sena">
                  Bodega
                </p>

                <h1 className="mt-1 text-2xl font-bold text-sena-text">
                  {nombreStand}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-sena-text/55">
                    {codigoStand}
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      stand.estado
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        stand.estado
                          ? 'bg-emerald-600'
                          : 'bg-red-600'
                      }`}
                    />

                    {stand.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    id_bodega
                      ? `/inventario/bodegas/${id_bodega}`
                      : '/inventario/bodegas',
                  )
                }
                className="rounded-lg border border-sena-dark/10 bg-white px-4 py-2.5 text-sm font-semibold text-sena-text transition hover:bg-sena-dark/5"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/inventario/bodegas/${id_bodega}/stands/${id_stand}/editar`,
                  )
                }
                className="rounded-lg bg-sena px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sena-dark"
              >
                Editar stand
              </button>

              <button
                type="button"
                className="rounded-lg bg-sena-dark px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Agregar producto al stand
              </button>
            </div>
          </div>
        </section>

        {/* Resumen */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-sena-text">
              Resumen del stand
            </h2>

            <p className="mt-1 text-sm text-sena-text/55">
              Información general del stand seleccionado.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sena-dark/8">
              <p className="text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Código del stand
              </p>

              <p className="mt-2 text-xl font-bold text-sena-text">
                {codigoStand}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sena-dark/8">
              <p className="text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Estado
              </p>

              <p
                className={`mt-2 text-lg font-bold ${
                  stand.estado
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {stand.estado ? 'Activo' : 'Inactivo'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sena-dark/8">
              <p className="text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Ubicación
              </p>

              <p className="mt-2 text-lg font-bold text-sena-text">
                Stand
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sena-dark/8">
              <p className="text-xs font-semibold uppercase tracking-wide text-sena-text/45">
                Cantidad de productos
              </p>

              <p className="mt-2 text-xl font-bold text-sena-text">
                0
              </p>
            </div>
          </div>
        </section>

        {/* Productos */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/8">
          <div className="flex flex-col gap-3 border-b border-sena-dark/8 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-sena-text">
                Productos en el stand
              </h2>

              <p className="mt-1 text-sm text-sena-text/55">
                Productos actualmente asociados a este stand.
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg bg-sena px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sena-dark"
            >
              Agregar producto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-sena-dark/5">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-sena-text/50">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-14 text-center"
                  >
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sena/10 text-sena">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-7 w-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m21 16-9 5-9-5V8l9-5 9 5v8Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m3 8 9 5 9-5M12 13v8"
                          />
                        </svg>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-sena-text">
                        No hay productos en este stand
                      </h3>

                      <p className="mt-1 text-sm text-sena-text/50">
                        Agrega un producto para comenzar a
                        gestionar el inventario de este stand.
                      </p>

                      <button
                        type="button"
                        className="mt-5 rounded-lg bg-sena px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sena-dark"
                      >
                        Agregar producto
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}