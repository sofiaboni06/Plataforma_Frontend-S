import type { UserProfile } from '../../types/profile'

type ProfileIdentityCardProps = {
  profile: UserProfile
}

export default function ProfileIdentityCard({ profile }: ProfileIdentityCardProps) {
  return (
    <section className="flex items-center gap-4">
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt={`Foto de ${profile.fullName}`}
          width={80}
          height={80}
          decoding="async"
          className="size-20 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid size-20 shrink-0 place-items-center rounded-full bg-sena-muted text-lg font-semibold text-sena-dark"
        >
          {profile.initials || profile.fullName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-sena-text">{profile.fullName}</h2>
        <p className="mt-0.5 text-sm font-medium text-sena-text/70">{profile.roleLabel}</p>
        <p className="mt-1 text-sm break-words text-sena-text/55">{profile.location}</p>
      </div>
    </section>
  )
}
