import { useAuth } from '@/modules/auth/context/auth'

export default function InventoryCenterBadge() {
  const { user, isAdmin } = useAuth()
  if (isAdmin || !user?.trainingCenter) return null

  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-glass-line bg-glass/80 px-4 py-2.5 text-[0.8125rem] text-sena-strong shadow-hairline backdrop-blur-glass-sm">
      <span className="max-w-[18rem] truncate font-semibold text-sena-text">{user.trainingCenter}</span>
    </div>
  )
}
