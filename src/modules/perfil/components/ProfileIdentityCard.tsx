import { useRef, useState, type ChangeEvent } from 'react'
import type { UserProfile } from '@/shared/types/profile'
import {
  BuildingIcon,
  CameraIcon,
  IdIcon,
  MailIcon,
  MapPinIcon,
  TrashIcon,
} from '@/modules/perfil/components/icons'
import { useProfilePhoto } from '@/modules/perfil/hooks/useProfilePhoto'

type ProfileIdentityCardProps = {
  profile: UserProfile
  loadPhoto: () => Promise<Blob>
  onUploadPhoto: (file: File) => Promise<void>
  onRemovePhoto: () => Promise<void>
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024

export default function ProfileIdentityCard({
  profile,
  loadPhoto,
  onUploadPhoto,
  onRemovePhoto,
}: ProfileIdentityCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const photoSrc = useProfilePhoto(profile.avatarUrl, loadPhoto, version)
  const initials = profile.initials || profile.fullName.slice(0, 2).toUpperCase()

  const details = [
    {
      icon: IdIcon,
      label: 'Documento',
      value: [profile.documentType, profile.documentId].filter(Boolean).join(' '),
    },
    { icon: MailIcon, label: 'Correo', value: profile.email },
    { icon: BuildingIcon, label: 'Centro de formación', value: profile.trainingCenter },
    { icon: MapPinIcon, label: 'Ubicación', value: profile.location },
  ].filter((item) => item.value)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError('Usa una imagen JPG, PNG o WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      setPhotoError('La imagen no puede pesar más de 8 MB.')
      return
    }

    setBusy(true)
    setPhotoError(null)
    try {
      await onUploadPhoto(file)
      setVersion((current) => current + 1)
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : 'No se pudo subir la foto.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    setBusy(true)
    setPhotoError(null)
    try {
      await onRemovePhoto()
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : 'No se pudo quitar la foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sena-dark/10">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-sena-dark via-sena-dark to-sena">
        <span className="perfil-float absolute -top-10 -right-8 size-40 rounded-full bg-white/10" />
        <span
          className="perfil-float absolute -bottom-12 left-6 size-32 rounded-full bg-white/10"
          style={{ animationDelay: '-3s' }}
        />
      </div>

      <div className="px-6 pb-6">
        <div className="relative z-10 -mt-16 flex flex-col items-center text-center">
          <div className="relative">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={`Foto de ${profile.fullName}`}
                width={128}
                height={128}
                decoding="async"
                className={`perfil-pop size-32 rounded-full object-cover object-top shadow-md ring-4 ring-white transition-opacity ${busy ? 'opacity-60' : ''}`}
              />
            ) : (
              <div
                aria-hidden="true"
                className={`perfil-pop grid size-32 place-items-center rounded-full bg-sena-muted text-4xl font-semibold text-sena-dark shadow-md ring-4 ring-white transition-opacity ${busy ? 'opacity-60' : ''}`}
              >
                {initials}
              </div>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              aria-label={profile.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
              className="absolute right-0 bottom-1 grid size-9 place-items-center rounded-full bg-sena text-white shadow-md ring-2 ring-white transition hover:scale-105 hover:bg-sena-dark disabled:opacity-60"
            >
              <CameraIcon className="size-[18px]" />
            </button>

            {profile.avatarUrl ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRemove()}
                aria-label="Quitar foto de perfil"
                className="absolute bottom-1 left-0 grid size-9 place-items-center rounded-full bg-white text-red-600 shadow-md ring-2 ring-white transition hover:scale-105 hover:bg-red-50 disabled:opacity-60"
              >
                <TrashIcon className="size-[18px]" />
              </button>
            ) : null}

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => void handleFile(event)}
            />
          </div>

          {photoError ? (
            <p role="alert" className="perfil-pop mt-3 text-xs font-medium text-red-600">
              {photoError}
            </p>
          ) : null}

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-sena-text">
            {profile.fullName}
          </h2>
          <span className="mt-2 inline-flex items-center rounded-full bg-sena/10 px-3 py-1 text-xs font-semibold text-sena-dark">
            {profile.roleLabel}
          </span>
        </div>

        <dl className="mt-6 space-y-4 border-t border-sena-dark/10 pt-5">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sena-muted text-sena-dark">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-sena-text/50">{label}</dt>
                <dd className="text-sm break-words text-sena-text">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}