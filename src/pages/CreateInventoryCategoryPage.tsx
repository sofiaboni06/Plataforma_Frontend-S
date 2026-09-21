import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import TextField from '../components/ui/TextField'
import { ApiError, api } from '../lib/api'
import type {
  CategoryApi,
  SubcategoryApi,
} from '../types/category'
import type { UserFormOptions } from '../types/profile'

type SubcategoryDraft = {
  id: number
  name: string
}

export default function CreateInventoryCategoryPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [trainingCenterId, setTrainingCenterId] = useState('')
  const [active, setActive] = useState(true)

  const [centers, setCenters] =
    useState<UserFormOptions['centers']>([])

  const [existingCategories, setExistingCategories] =
    useState<CategoryApi[]>([])

  const [existingSubcategories, setExistingSubcategories] =
    useState<SubcategoryApi[]>([])

  const [subcategories, setSubcategories] =
    useState<SubcategoryDraft[]>([])

  const [subcategoryName, setSubcategoryName] =
    useState('')

  const [loadingCenters, setLoadingCenters] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [warningMessage, setWarningMessage] =
    useState<string | null>(null)

  useEffect(() => {
    document.title =
      'Crear categoría | Inventario | SENA'
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCenters() {
      try {
        const [options, categoryList, subcategoryList] =
          await Promise.all([
            api<UserFormOptions>(
              '/users/options',
            ),
            api<CategoryApi[]>(
              '/categorias',
            ),
            api<SubcategoryApi[]>(
              '/subcategorias',
            ),
          ])

        if (cancelled) return

        setCenters(options.centers)
        setExistingCategories(categoryList)
        setExistingSubcategories(subcategoryList)
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'No se pudieron cargar los centros de formación.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingCenters(false)
        }
      }
    }

    void loadCenters()

    return () => {
      cancelled = true
    }
  }, [])

  const normalizeName = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ')

  const addSubcategory = () => {
    const value = subcategoryName.trim()

    if (!value) return

    const normalizedValue = normalizeName(value)

    const existingSubcategory = existingSubcategories.find(
      (item) => normalizeName(item.nombre) === normalizedValue,
    )

    if (existingSubcategory) {
      const parentCategory = existingCategories.find(
        (category) => category.id === existingSubcategory.idCategoria,
      )

      setWarningMessage(
        `La subcategoría "${value}" ya está creada en "${parentCategory?.nombre ?? 'otra categoría'}".`,
      )

      return
    }

    const duplicateInForm = subcategories.some(
      (item) => normalizeName(item.name) === normalizedValue,
    )

    if (duplicateInForm) {
      setWarningMessage(
        `La subcategoría "${value}" ya está creada en "${name.trim() || 'esta categoría'}".`,
      )
      return
    }

    setSubcategories((current) => [
      ...current,
      {
        id: Date.now(),
        name: value,
      },
    ])

    setSubcategoryName('')
  }

  const removeSubcategory = (
    id: number,
  ) => {
    setSubcategories((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
    )
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!trainingCenterId || !name.trim()) {
      setError(
        'Completa el centro de formación y el nombre de la categoría.',
      )
      return
    }

    const centerId = Number(trainingCenterId)

    if (!Number.isInteger(centerId) || centerId <= 0) {
      setError(
        'Selecciona un centro de formación válido.',
      )
      return
    }

    const normalizedName = name
      .trim()
      .toLowerCase()

    const duplicatedCategory =
      existingCategories.some(
        (category) =>
          category.nombre
            .trim()
            .toLowerCase() === normalizedName,
      )

    if (duplicatedCategory) {
      setWarningMessage(
        `La categoría "${name.trim()}" ya está creada.`,
      )
      return
    }

    setSaving(true)
    setError(null)

    try {
      for (const subcategory of subcategories) {
        const normalizedValue = normalizeName(
          subcategory.name,
        )

        const existingSubcategory =
          existingSubcategories.find(
            (item) =>
              normalizeName(item.nombre) ===
              normalizedValue,
          )

        if (existingSubcategory) {
          const parentCategory =
            existingCategories.find(
              (category) =>
                category.id ===
                existingSubcategory.idCategoria,
            )

          setWarningMessage(
            `La subcategoría "${subcategory.name}" ya está creada en "${parentCategory?.nombre ?? 'otra categoría'}".`,
          )

          setSaving(false)
          return
        }
      }

      const createdCategory = await api<CategoryApi>(
        '/categorias',
        {
          method: 'POST',
          body: JSON.stringify({
            idCformacion: centerId,
            nombre: name.trim(),
            estado: active,
          }),
        },
      )

      for (const subcategory of subcategories) {
        await api<SubcategoryApi>(
          '/subcategorias',
          {
            method: 'POST',
            body: JSON.stringify({
              idCategoria: createdCategory.id,
              nombre: subcategory.name,
              estado: true,
            }),
          },
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
          : 'No se pudo crear la categoría.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Crear categoría">
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
          onSubmit={handleSubmit}
          className="w-full max-w-[760px] rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-sena-dark/8 sm:px-8 sm:py-7"
        >
          <div className="flex items-center gap-3 border-b border-sena-dark/10 pb-4">
            <FolderIcon className="size-7 text-sena-dark" />

            <h1 className="text-xl font-semibold tracking-tight text-sena-dark">
              Información de la categoría
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
              value={trainingCenterId}
              onChange={setTrainingCenterId}
              disabled={
                loadingCenters ||
                saving
              }
              placeholder={
                loadingCenters
                  ? 'Cargando centros de formación...'
                  : 'Selecciona un centro de formación'
              }
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
                <div className="grid grid-cols-[1fr_auto_auto] items-center bg-sena-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-sena-text/50">
                  <span>NOMBRE</span>
                  <span className="w-10" />
                  <span className="w-10" />
                </div>

                {subcategories.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-sena-dark/8 px-3 py-2.5"
                    >
                      <span className="text-sm text-sena-text">
                        {item.name}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeSubcategory(
                            item.id,
                          )
                        }
                        className="grid size-9 place-items-center rounded-lg text-sena-text/50 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        ×
                      </button>

                      <span className="grid size-9 place-items-center text-sena">
                        ✓
                      </span>
                    </div>
                  ),
                )}

                <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-sena-dark/8 p-3">
                  <input
                    id="subcategory-input"
                    value={subcategoryName}
                    onChange={(event) =>
                      setSubcategoryName(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        'Enter'
                      ) {
                        event.preventDefault()
                        addSubcategory()
                      }
                    }}
                    placeholder="Ej: Agua"
                    disabled={saving}
                    className="h-11 w-full rounded-lg border border-transparent bg-sena-muted px-3.5 text-sm text-sena-text outline-none placeholder:text-sena-text/40 focus:border-sena focus:bg-white focus:ring-2 focus:ring-sena/20"
                  />

                  <button
                    type="button"
                    onClick={
                      addSubcategory
                    }
                    disabled={
                      !subcategoryName.trim() ||
                      saving
                    }
                    className="h-11 rounded-lg px-3 text-sm font-semibold text-sena-dark hover:bg-sena-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>(
                      '#subcategory-input',
                    )
                    ?.focus()
                }
                className="mt-2 text-sm font-semibold text-sena-dark hover:underline"
              >
                + Agregar subcategoría
              </button>
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
                  value === 'active',
                )
              }
              disabled={saving}
              options={[
                {
                  value: 'active',
                  label: '●  Activa',
                },
                {
                  value: 'inactive',
                  label: '●  Inactiva',
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
                loadingCenters ||
                !trainingCenterId ||
                !name.trim()
              }
            >
              {saving
                ? 'Guardando…'
                : 'Guardar categoría'}
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
  placeholder,
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
  placeholder?: string
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

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          required={required}
          disabled={disabled}
          className="h-12 w-full appearance-none rounded-xl border border-sena-dark/10 bg-white px-3.5 pr-10 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20 disabled:bg-sena-muted disabled:opacity-70"
        >
          {placeholder ? (
            <option value="">
              {placeholder}
            </option>
          ) : null}

          {options.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sena-text/45">
          <ChevronDownIcon className="size-4" />
        </span>
      </div>
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
      <path d="M3.5 6.5v-1a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function ChevronDownIcon({
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
      <path d="m6 9 6 6 6-6" />
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
