import type { ComponentType, FormEvent, SVGProps } from 'react'
import type { ProfileDraft } from '@/shared/types/profile'
import Button from '@/shared/components/ui/Button'
import {
  IdIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from '@/modules/perfil/components/icons'

type PersonalInfoFormProps = {
  value: ProfileDraft
  isEditing: boolean
  saveMessage: string | null
  errorMessage: string | null
  isSaving: boolean
  onChange: (name: keyof ProfileDraft, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: () => void
  onCancel: () => void
}

type Row = {
  name: keyof ProfileDraft
  label: string
  editable: boolean
  type?: string
  maxLength?: number
  select?: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
  wide?: boolean
}

// Ajusta esta lista a los tipos que use tu módulo de usuarios.
const DOCUMENT_TYPES = ['CC', 'CE', 'TI', 'PEP', 'PPT', 'PAS']

const ROWS: Row[] = [
  { name: 'nombres', label: 'Nombres', editable: true, maxLength: 100, icon: UserIcon },
  { name: 'apellidos', label: 'Apellidos', editable: true, maxLength: 100, icon: UserIcon },
  { name: 'documentType', label: 'Tipo de documento', editable: true, select: true, icon: IdIcon },
  { name: 'documentId', label: 'Número de documento', editable: true, maxLength: 30, icon: IdIcon },
  {
    name: 'email',
    label: 'Correo electrónico',
    editable: true,
    type: 'email',
    maxLength: 150,
    icon: MailIcon,
    wide: true,
  },
  { name: 'phone', label: 'Teléfono', editable: false, type: 'tel', icon: PhoneIcon },
  { name: 'address', label: 'Dirección', editable: false, icon: MapPinIcon },
]

const FIELD_CLASS =
  'mt-1 h-9 w-full rounded-md border border-sena/30 bg-white px-2.5 text-sm text-sena-text outline-none focus:border-sena focus:ring-2 focus:ring-sena/20'

export default function PersonalInfoForm({
  value,
  isEditing,
  saveMessage,
  errorMessage,
  isSaving,
  onChange,
  onSubmit,
  onEdit,
  onCancel,
}: PersonalInfoFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-sena-text">Información personal</h3>
          <p className="mt-0.5 text-sm text-sena-text/55">
            {isEditing ? 'Actualiza tus datos y guarda los cambios.' : 'Datos asociados a tu cuenta.'}
          </p>
        </div>
        {!isEditing ? (
          <Button type="button" size="sm" onClick={onEdit}>
            <span className="inline-flex items-center gap-1.5">
              <PencilIcon className="size-4" />
              Editar
            </span>
          </Button>
        ) : null}
      </div>

      {saveMessage ? (
        <p
          role="status"
          className="perfil-pop mt-4 rounded-xl bg-sena/10 px-4 py-3 text-sm font-medium text-sena-dark"
        >
          {saveMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="perfil-pop mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {ROWS.map((row, index) => {
          const canEdit = isEditing && row.editable
          const Icon = row.icon
          const current = value[row.name]
          const hasValue = Boolean(current)

          const options =
            row.select && current && !DOCUMENT_TYPES.includes(current)
              ? [current, ...DOCUMENT_TYPES]
              : DOCUMENT_TYPES

          return (
            <div
              key={row.name}
              style={{ ['--delay' as string]: `${index * 50}ms` }}
              className={`perfil-rise rounded-xl border p-4 transition-colors ${
                canEdit
                  ? 'border-sena/40 bg-white ring-2 ring-sena/10'
                  : 'border-sena-dark/10 bg-sena-muted/40'
              } ${row.wide ? 'sm:col-span-2' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-sena shadow-sm ring-1 ring-sena-dark/10">
                  <Icon className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor={row.name} className="block text-xs font-medium text-sena-text/55">
                    {row.label}
                  </label>
                  {canEdit && row.select ? (
                    <select
                      id={row.name}
                      name={row.name}
                      value={current}
                      required
                      onChange={(event) => onChange(row.name, event.target.value)}
                      className={FIELD_CLASS}
                    >
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : canEdit ? (
                    <input
                      id={row.name}
                      name={row.name}
                      type={row.type ?? 'text'}
                      value={current}
                      required
                      maxLength={row.maxLength}
                      onChange={(event) => onChange(row.name, event.target.value)}
                      className={FIELD_CLASS}
                    />
                  ) : (
                    <p
                      className={`mt-0.5 truncate text-sm ${
                        hasValue ? 'font-medium text-sena-text' : 'text-sena-text/45'
                      }`}
                    >
                      {hasValue ? current : 'Sin registrar'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isEditing ? (
        <div className="perfil-fade mt-6 flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </form>
  )
}