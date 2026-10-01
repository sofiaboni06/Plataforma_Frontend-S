import { useAuth } from '@/modules/auth/context/auth'
import { useInventoryCenterOptional } from '@/modules/inventario/centerScope'

export default function InventoryCenterBadge() {
  const { user } = useAuth()
  const center = useInventoryCenterOptional()
  const centerLabel = center?.centerId ? center.centerName : (user?.trainingCenter ?? '')

  if (!centerLabel) return null

  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-glass-line bg-glass/80 px-4 py-2.5 text-[0.8125rem] text-sena-strong shadow-hairline backdrop-blur-glass-sm">
      <span className="max-w-[18rem] truncate font-semibold text-sena-text">{centerLabel}</span>
      {center?.isAdmin && center.centerId ? (
        <button
          type="button"
          onClick={center.clear}
          className="shrink-0 border-l border-sena-line pl-3 text-xs font-semibold text-sena-strong transition hover:text-sena-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena"
        >
          Cambiar centro
        </button>
      ) : null}
    </div>
  )
}