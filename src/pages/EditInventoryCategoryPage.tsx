import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import { ApiError, api } from '../lib/api'
import type {
  CategoryApi,
  SubcategoryApi,
} from '../types/category'
import type {
  UserFormOptions,
} from '../types/profile'

export default function EditInventoryCategoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [category, setCategory] =
    useState<CategoryApi | null>(null)

  const [centers, setCenters] =
    useState<UserFormOptions['centers']>([])

  const [subcategories, setSubcategories] =
    useState<SubcategoryApi[]>([])

  const [name, setName] =
    useState('')

  const [trainingCenterId, setTrainingCenterId] =
    useState('')

  const [active, setActive] =
    useState(true)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) return

      try {
        const [
          categoryData,
          options,
          subcategoryData,
        ] = await Promise.all([
          api<CategoryApi>(
            `/categorias/${id}`,
          ),
          api<UserFormOptions>(
            '/users/options',
          ),
          api<SubcategoryApi[]>(
            '/subcategorias',
          ),
        ])

        if (cancelled) return

        setCategory(
          categoryData,
        )

        setCenters(
          options.centers,
        )

        setSubcategories(
          subcategoryData.filter(
            (item) =>
              item.idCategoria ===
              categoryData.id,
          ),
        )

        setName(
          categoryData.nombre,
        )

        setTrainingCenterId(
          String(
            categoryData.idCformacion,
          ),
        )

        setActive(
          categoryData.estado,
        )
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudo cargar la categoría.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (
      !id ||
      !name.trim() ||
      !trainingCenterId
    ) {
      setError(
        'Completa todos los campos obligatorios.',
      )
      return
    }

    setSaving(true)
    setError(null)

    try {
      await api<CategoryApi>(
        `/categorias/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            idCformacion:
              Number(
                trainingCenterId,
              ),
            nombre:
              name.trim(),
            estado: active,
          }),
        },
      )

      navigate(
        '/inventario/categorias',
        { replace: true },
      )
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo guardar la categoría.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Editar categoría">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <p className="text-sm text-sena-text/55">
            Cargando categoría…
          </p>
        </div>
      </AppLayout>
    )
  }

  if (!category) {
    return (
      <AppLayout title="Editar categoría">
        <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center">
          <p className="text-sm text-red-700">
            {error ??
              'Categoría no encontrada.'}
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Editar categoría">
      <div className="flex min-h-[calc(100svh-7rem)] items-center justify-center py-8">
        <form
          onSubmit={
            handleSubmit
          }
          className="w-full max-w-[760px] rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-sena-dark/8 sm:px-8 sm:py-7"
        >
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-4">
            <FolderIcon className="size-7 text-sena-dark" />

            <h1 className="text-xl font-semibold text-sena-dark">
              Editar categoría
            </h1>
          </div>

          {error ? (
            <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-7 grid gap-5">
            <SelectField
              id="trainingCenterId"
              label="Centro de formación"
              required
              value={
                trainingCenterId
              }
              onChange={
                setTrainingCenterId
              }
              disabled={saving}
              options={centers.map(
                (center) => ({
                  value: String(
                    center.id,
                  ),
                  label:
                    center.regional
                      ? `${center.name} — ${center.regional}`
                      : center.name,
                }),
              )}
            />

            <TextField
              id="categoryName"
              label="Nombre de la categoría"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Ej: Pintura"
              required
              disabled={saving}
            />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-sena-text">
                  Subcategorías
                </h2>

                <span className="text-xs text-sena-text/50">
                  Opcionales
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-sena-dark/10">
                <div className="bg-sena-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-sena-text/50">
                  NOMBRE
                </div>

                {subcategories.length ===
                0 ? (
                  <div className="border-t border-sena-dark/8 px-3 py-5 text-center text-sm text-sena-text/45">
                    No hay subcategorías registradas.
                  </div>
                ) : (
                  subcategories.map(
                    (subcategory) => (
                      <div
                        key={
                          subcategory.id
                        }
                        className="border-t border-sena-dark/8 px-3 py-2.5 text-sm text-sena-text"
                      >
                        {
                          subcategory.nombre
                        }
                      </div>
                    ),
                  )
                )}
              </div>
            </section>

            <SelectField
              id="active"
              label="Estado"
              required
              value={
                active
                  ? 'active'
                  : 'inactive'
              }
              onChange={(value) =>
                setActive(
                  value ===
                    'active',
                )
              }
              disabled={saving}
              options={[
                {
                  value: 'active',
                  label: '●  Activa',
                },
                {
                  value:
                    'inactive',
                  label:
                    '●  Inactiva',
                },
              ]}
            />
          </div>

          <div className="mt-7 flex justify-end gap-3 border-t border-sena-dark/10 pt-5">
            <Link to="/inventario/categorias">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
              >
                Cancelar
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={
                saving ||
                !name.trim() ||
                !trainingCenterId
              }
            >
              {saving
                ? 'Guardando…'
                : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: {
  id: string
  label: string
  value: string
  onChange: (
    value: string,
  ) => void
  options: Array<{
    value: string
    label: string
  }>
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-sena-dark"
      >
        {label}

        {required ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        disabled={disabled}
        required={required}
        className="h-12 w-full rounded-xl border border-sena-dark/10 bg-white px-3.5 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20 disabled:bg-sena-muted"
      >
        <option value="">
          Selecciona un centro de formación
        </option>

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          ),
        )}
      </select>
    </div>
  )
}

function FolderIcon({
  className,
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9.5a2 2 0 0 1 2-2Z" />
    </svg>
  )
}
