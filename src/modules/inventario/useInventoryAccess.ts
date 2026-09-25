import { useAuth } from '@/modules/auth/context/auth'
import {
  canInventoryAction,
  visibleInventoryScreens,
  type InventoryAction,
  type InventoryScreenCode,
} from '@/modules/inventario/navigation'

export function useInventoryAccess() {
  const { modules } = useAuth()

  return {
    screens: visibleInventoryScreens(modules),
    can: (screen: InventoryScreenCode, action: InventoryAction) =>
      canInventoryAction(modules, screen, action),
  }
}
