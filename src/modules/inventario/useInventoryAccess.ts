import { useAuth } from '@/modules/auth/context/auth'
import {
  allowsPermission,
  canInventoryAction,
  visibleInventoryScreens,
  type InventoryAction,
  type InventoryScreenCode,
} from '@/modules/inventario/navigation'

export function useInventoryAccess() {
  const { isAdmin, user } = useAuth()
  const access = { isAdmin, permissions: user?.permissions }

  return {
    screens: visibleInventoryScreens(access),
    can: (screen: InventoryScreenCode, action: InventoryAction) =>
      canInventoryAction(screen, action, access),
    permit: (code: string, ..._ignored: Array<InventoryScreenCode | InventoryAction>) => {
      void _ignored
      return allowsPermission(isAdmin, user?.permissions, code)
    },
  }
}
