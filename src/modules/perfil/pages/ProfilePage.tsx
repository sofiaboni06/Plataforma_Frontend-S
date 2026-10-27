import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import AppLayout from '@/shared/components/layout/AppLayout'
import NotificationsPanel from '@/modules/perfil/components/NotificationsPanel'
import PasswordForm from '@/modules/perfil/components/PasswordForm'
import PersonalInfoForm from '@/modules/perfil/components/PersonalInfoForm'
import ProfileIdentityCard from '@/modules/perfil/components/ProfileIdentityCard'
import { BellIcon, LockIcon, UserIcon } from '@/modules/perfil/components/icons'
import { splitFullName } from '@/modules/perfil/lib/nombre'
import { useNotifications } from '@/modules/notificaciones/context/notifications'
import { ApiError } from '@/shared/lib/api'
import { useAuth, type UpdateProfileInput } from '@/modules/auth/context/auth'
import type { ProfileDraft, UserProfile } from '@/shared/types/profile'
import '@/modules/perfil/styles/perfil.css'

type TabId = 'info' | 'password' | 'notifications'

const TABS = [
  { id: 'info', label: 'Información', icon: UserIcon },
  { id: 'password', label: 'Contraseña', icon: LockIcon },
  { id: 'notifications', label: 'Notificaciones', icon: BellIcon },
] as const

function toDraft(profile: UserProfile): ProfileDraft {
  const fallback = splitFullName(profile.fullName)
  return {
    nombres: profile.nombres ?? fallback.nombres,
    apellidos: profile.apellidos ?? fallback.apellidos,
    documentType: profile.documentType,
    documentId: profile.documentId,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
  }
}

// Solo se envía lo que el usuario cambió, como pide el contrato.
function buildChanges(original: ProfileDraft, edited: ProfileDraft): UpdateProfileInput {
  const changes: UpdateProfileInput = {}
  const nombres = edited.nombres.trim()
  const apellidos = edited.apellidos.trim()
  const documentId = edited.documentId.trim()
  const email = edited.email.trim()

  if (nombres !== original.nombres.trim()) changes.nombres = nombres
  if (apellidos !== original.apellidos.trim()) changes.apellidos = apellidos
  if (edited.documentType !== original.documentType) changes.tipoDocumento = edited.documentType
  if (documentId !== original.documentId.trim()) changes.numeroDocumento = documentId
  if (email !== original.email.trim()) changes.email = email
  return changes
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword, loadPhoto, uploadPhoto, removePhoto } = useAuth()
  const { unread } = useNotifications()
  const location = useLocation()
  const requestedTab = (location.state as { tab?: TabId } | null)?.tab
  const [tab, setTab] = useState<TabId>(requestedTab ?? 'info')

  useEffect(() => {
    if (requestedTab) setTab(requestedTab)
  }, [requestedTab, location.key])
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Mi perfil | SENA'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    if (!isEditing) return
    document.getElementById('nombres')?.focus()
  }, [isEditing])

  if (!user) {
    return (
      <AppLayout title="Mi perfil">
        <p className="text-sm text-sena-text/70">No se pudo cargar el perfil.</p>
      </AppLayout>
    )
  }

  const original = toDraft(user)
  const current = draft ?? original

  const handleEdit = () => {
    setDraft(toDraft(user))
    setSaveMessage(null)
    setErrorMessage(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDraft(null)
    setIsEditing(false)
    setErrorMessage(null)
  }

  const handleChange = (name: keyof ProfileDraft, value: string) => {
    setDraft((currentDraft) => ({ ...(currentDraft ?? toDraft(user)), [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSaveMessage(null)

    const changes = buildChanges(original, current)
    if (Object.keys(changes).length === 0) {
      setIsEditing(false)
      setDraft(null)
      setSaveMessage('No hay cambios para guardar.')
      return
    }

    setIsSaving(true)
    try {
      await updateProfile(changes)
      setIsEditing(false)
      setDraft(null)
      setSaveMessage('Cambios guardados correctamente.')
    } catch (caught) {
      setErrorMessage(caught instanceof ApiError ? caught.message : 'No se pudieron guardar los cambios.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout title="Mi perfil">
      <div className="mx-auto max-w-6xl">
        <div className="perfil-rise mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-sena-text">Mi perfil</h1>
          <p className="mt-1 text-sm text-sena-text/60">
            Administra tu información, tu contraseña y tus notificaciones.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="perfil-rise" style={{ ['--delay' as string]: '60ms' }}>
            <ProfileIdentityCard
              profile={user}
              loadPhoto={loadPhoto}
              onUploadPhoto={uploadPhoto}
              onRemovePhoto={removePhoto}
            />
          </div>

          <section
            className="perfil-rise rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/10"
            style={{ ['--delay' as string]: '120ms' }}
          >
            <div className="border-b border-sena-dark/10 p-3 sm:p-4">
              <div
                role="tablist"
                aria-label="Secciones del perfil"
                className="flex gap-1 rounded-xl bg-sena-muted p-1"
              >
                {TABS.map(({ id, label, icon: Icon }) => {
                  const active = tab === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(id)}
                      className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-white text-sena-dark shadow-sm'
                          : 'text-sena-text/60 hover:text-sena-text'
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="hidden sm:inline">{label}</span>
                      {id === 'notifications' && unread > 0 ? (
                        <span className="grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] leading-5 font-semibold text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div key={tab} role="tabpanel" className="perfil-fade p-5 sm:p-7">
              {tab === 'info' ? (
                <PersonalInfoForm
                  value={current}
                  isEditing={isEditing}
                  saveMessage={saveMessage}
                  errorMessage={errorMessage}
                  isSaving={isSaving}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                />
              ) : null}

              {tab === 'password' ? <PasswordForm onSubmit={changePassword} /> : null}

              {tab === 'notifications' ? <NotificationsPanel /> : null}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}