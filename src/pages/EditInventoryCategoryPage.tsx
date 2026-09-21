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

  const [allSubcategories, setAllSubcategories] =
    useState<SubcategoryApi[]>([])

  const [allCategories, setAllCategories] =
    useState<CategoryApi[]>([])

  const [removedSubcategoryIds, setRemovedSubcategoryIds] =
    useState<number[]>([])

  const [newSubcategoryName, setNewSubcategoryName] =
    useState('')

  const normalizeName = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ')

  const addSubcategory = () => {
    const value = newSubcategoryName.trim()

    if (!value) return

    const normalizedValue = normalizeName(value)

    const existingSubcategory = allSubcategories.find(
      (item) =>
        normalizeName(item.nombre) === normalizedValue &&
        item.estado,
    )

    if (existingSubcategory) {
      const parentCategory = allCategories.find(
        (item) =>
          item.id === existingSubcategory.idCategoria,
      )

      setWarningMessage(
        `La subcategoría "${value}" ya está creada en "${parentCategory?.nombre ?? 'otra categoría'}".`,
      )

      return
    }

    const duplicateInForm = subcategories.some(
      (item) =>
        normalizeName(item.nombre) === normalizedValue,
    )

    if (duplicateInForm) {
      setWarningMessage(
        `La subcategoría "${value}" ya está creada en "${category?.nombre ?? 'esta categoría'}".`,
      )

      return
    }

    setSubcategories((current) => [
      ...current,
      {
        id: -Date.now(),
        idCategoria: Number(id),
        nombre: value,
        estado: true,
      },
    ])

    setNewSubcategoryName('')
    setError(null)
  }

  const removeSubcategory = (subcategoryId: number) => {
    if (subcategoryId > 0) {
      setRemovedSubcategoryIds((current) =>
        current.includes(subcategoryId)
          ? current
          : [...current, subcategoryId],
      )
    }

    setSubcategories((current) =>
      current.filter(
        (item) => item.id !== subcategoryId,
      ),
    )
  }

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

  const [warningMessage, setWarningMessage] =
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
          categoryList,
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
          api<CategoryApi[]>(
            '/categorias',
          ),
        ])

        if (cancelled) return

        setCategory(
          categoryData,
        )

        setCenters(
          options.centers,
        )

        setAllSubcategories(
          subcategoryData,
        )

        setAllCategories(
          categoryList,
        )

        setSubcategories(
          subcategoryData.filter(
            (item) =>
              item.idCategoria ===
              categoryData.id &&
              item.estado,
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
            idCformacion: Number(trainingCenterId),
            nombre: name.trim(),
            estado: active,
          }),
        },
      )

      if (removedSubcategoryIds.length > 0) {
        await Promise.all(
          removedSubcategoryIds.map(
            (subcategoryId) =>
              api<SubcategoryApi>(
                `/subcategorias/${subcategoryId}`,
                {
                  method: 'PATCH',
                  body: JSON.stringify({
                    estado: false,
                  }),
                },
              ),
          ),
        )
      }

      const newSubcategories =
        subcategories.filter(
          (subcategory) =>
            subcategory.id < 0,
        )

      for (const subcategory of newSubcategories) {
        const normalizedValue = normalizeName(
          subcategory.nombre,
        )

        const existingSubcategory =
          allSubcategories.find(
            (item) =>
              item.id > 0 &&
              normalizeName(item.nombre) ===
              normalizedValue,
          )

        if (existingSubcategory) {
          const parentCategory =
            allCategories.find(
              (category) =>
                category.id ===
                existingSubcategory.idCategoria,
            )

          setWarningMessage(
            `La subcategoría "${subcategory.nombre}" ya está creada en "${parentCategory?.nombre ?? 'otra categoría'}".`,
          )

          setSaving(false)
          return
        }
      }

      if (newSubcategories.length > 0) {
        await Promise.all(
          newSubcategories.map(
            (subcategory) =>
              api<SubcategoryApi>(
                '/subcategorias',
                {
                  method: 'POST',
                  body: JSON.stringify({
                    idCategoria: Number(id),
                    nombre: subcategory.nombre,
                    estado: true,
                  }),
                },
              ),
          ),
        )
      }

      navigate(
        '/inventario/categorias',
        { replace: true },
      )
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudieron guardar los cambios.',
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
      {warningMessage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setWarningMessage(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                <WarningIcon className="size-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-sena-dark">
                  Advertencia
                </h2>

                <p className="mt-1 text-sm text-sena-text/55">
                  Revisa la información ingresada.
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-sena-text/70">
              {warningMessage}
            </p>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={() => setWarningMessage(null)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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

              <div className="mb-3 flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <TextField
                    id="newSubcategoryName"
                    label="Nueva subcategoría"
                    value={newSubcategoryName}
                    onChange={(event) =>
                      setNewSubcategoryName(
                        event.target.value,
                      )
                    }
                    placeholder="Ej: Brochas"
                    disabled={saving}
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={addSubcategory}
                  disabled={saving}
                >
                  Agregar
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-sena-dark/10">
                <div className="grid grid-cols-[1fr_auto] items-center bg-sena-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-sena-text/50">
                  <span>NOMBRE</span>
                  <span className="w-9" />
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
                        className="grid grid-cols-[1fr_auto] items-center border-t border-sena-dark/8 px-3 py-2.5"
                      >
                        <span className="text-sm text-sena-text">
                          {subcategory.nombre}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeSubcategory(
                              subcategory.id,
                            )
                          }
                          disabled={saving}
                          className="grid size-8 place-items-center rounded-lg text-sena-text/45 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Quitar ${subcategory.nombre}`}
                          title={`Quitar ${subcategory.nombre}`}
                        >
                          ×
                        </button>
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

function WarningIcon({
  className,
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.3 3.9 2.5 17.5a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
