import { useAuth } from '@/modules/auth/context/auth'
import {
  canInventoryAction,
  visibleInventoryScreens,
  type InventoryAction,
  type InventoryScreenCode,
} from '@/modules/inventario/navigation'

export function useInventoryAccess() {
  const { modules, isAdmin, user } = useAuth()
  const access = { isAdmin, permissions: user?.permissions }

  return {
    screens: visibleInventoryScreens(modules, access),
    can: (screen: InventoryScreenCode, action: InventoryAction) =>
      canInventoryAction(modules, screen, action),
    permit: (code: string, screen: InventoryScreenCode, action: InventoryAction) => {
      if (isAdmin) return true
      if (user?.permissions) return user.permissions.includes(code)
      return canInventoryAction(modules, screen, action)
    },
  }
}
