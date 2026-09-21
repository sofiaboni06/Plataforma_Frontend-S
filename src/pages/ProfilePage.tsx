import { useEffect, useState, type FormEvent } from 'react'
import AppLayout from '../components/layout/AppLayout'
import PasswordForm from '../components/profile/PasswordForm'
import PersonalInfoForm from '../components/profile/PersonalInfoForm'
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { ProfileDraft } from '../types/profile'

type TabId = 'info' | 'password' | 'notifications'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'info', label: 'Información' },
  { id: 'password', label: 'Cambiar contraseña' },
  { id: 'notifications', label: 'Notificaciones' },
]

function toDraft(profile: { documentId: string; email: string; phone: string; address: string }): ProfileDraft {
  return {
    documentId: profile.documentId,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
  }
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth()
  const [tab, setTab] = useState<TabId>('info')
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
    document.getElementById('documentId')?.focus()
  }, [isEditing])

  if (!user) {
    return (
      <AppLayout title="Mi perfil">
        <p className="text-sm text-sena-text/70">No se pudo cargar el perfil.</p>
      </AppLayout>
    )
  }

  const current = draft ?? toDraft(user)

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
    setIsSaving(true)
    setErrorMessage(null)
    setSaveMessage(null)
    try {
      await updateProfile({
        email: current.email,
        numeroDocumento: current.documentId,
      })
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
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-sena-text">Mi perfil</h1>

        <div className="mt-6">
          <ProfileIdentityCard profile={user} />
        </div>

        <div className="mt-8 flex gap-6 border-b border-sena-dark/10 text-sm font-medium">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                tab === item.id
                  ? 'border-b-2 border-sena pb-3 text-sena'
                  : 'pb-3 text-sena-text/55 hover:text-sena-text'
              }
            >
              {item.label}
            </button>
          ))}
        </div>

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

        {tab === 'notifications' ? (
          <p className="mt-6 max-w-xl text-sm leading-6 text-sena-text/70">
            Esta pestaña está en el diseño. El dump no tiene tabla de notificaciones; el equipo que
            tome ese módulo debe crear modelo, validador, servicio y `GET/PATCH /api/v1/account/notifications`.
          </p>
        ) : null}
      </div>
    </AppLayout>
  )
}
