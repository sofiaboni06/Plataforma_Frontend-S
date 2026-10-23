import { useAuth } from '@/modules/auth/context/auth'
import {
  allowsFormacionPermission,
  canFormacionAction,
  visibleFormacionMenuScreens,
  type FormacionAction,
  type FormacionScreenCode,
} from '@/modules/materiales-formacion/navigation'

export function useFormacionAccess() {
  const { isAdmin, user } = useAuth()
  const access = { isAdmin, permissions: user?.permissions }

  return {
    isAdmin,
    screens: visibleFormacionMenuScreens(access),
    can: (screen: FormacionScreenCode, action: FormacionAction) =>
      canFormacionAction(screen, action, access),
    permit: (code: string) => allowsFormacionPermission(access, code),
  }
}
