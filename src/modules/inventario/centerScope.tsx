import { Outlet } from 'react-router-dom'

export function useInventoryCenterOptional() {
  return null
}

export default function InventoryCenterLayout() {
  return <Outlet />
}
