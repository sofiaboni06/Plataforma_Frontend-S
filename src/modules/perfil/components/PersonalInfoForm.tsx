import type { FormEvent } from 'react'
import type { ProfileDraft } from '@/shared/types/profile'
import Button from '@/shared/components/ui/Button'

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

const ROWS: Array<{ name: keyof ProfileDraft; label: string; editable: boolean; type?: string }> = [
  { name: 'documentId', label: 'Documento', editable: true },
  { name: 'email', label: 'Correo electrónico', editable: true, type: 'email' },
  { name: 'phone', label: 'Teléfono', editable: false, type: 'tel' },
  { name: 'address', label: 'Dirección', editable: false },
]

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
    <form onSubmit={onSubmit} className="mt-6">
      <h3 className="text-base font-semibold text-sena-text">Información personal</h3>

      {saveMessage ? (
        <p role="status" className="mt-3 rounded-lg bg-sena/10 px-3 py-2 text-sm font-medium text-sena-dark">
          {saveMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-sena-dark/10">
        <table className="w-full text-sm">
          <tbody>
            {ROWS.map((row) => {
              const display = value[row.name] || 'Sin registrar'
              const canEdit = isEditing && row.editable

              return (
                <tr key={row.name} className="border-b border-sena-dark/10 last:border-b-0">
                  <th
                    scope="row"
                    className="w-[38%] bg-sena-muted/80 px-4 py-3 text-left font-medium text-sena-text/75"
                  >
                    {row.label}
                  </th>
                  <td className="px-4 py-2.5 text-sena-text">
                    {canEdit ? (
                      <input
                        id={row.name}
                        name={row.name}
                        type={row.type ?? 'text'}
                        value={value[row.name]}
                        required
                        onChange={(event) => onChange(row.name, event.target.value)}
                        className="h-9 w-full rounded-md border border-sena/30 bg-white px-2.5 outline-none focus:border-sena focus:ring-2 focus:ring-sena/20"
                      />
                    ) : (
                      <span className={value[row.name] ? '' : 'text-sena-text/45'}>{display}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="button" onClick={onEdit}>
            Editar
          </Button>
        )}
      </div>
    </form>
  )
}
