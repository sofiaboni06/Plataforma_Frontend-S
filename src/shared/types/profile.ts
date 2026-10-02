export type UserProfile = {
  id: number
  fullName: string
  roleLabel: string
  location: string
  avatarUrl: string
  documentType: string
  documentId: string
  email: string
  phone: string
  address: string
  trainingCenter: string
  trainingCenterId?: number
  regional?: string
  groupCode: string
  role: string
  initials: string
  isAdmin?: boolean
  permissions?: string[]
  bodegaIds?: number[]
  bodegas?: Array<{ id: number; name: string }>
}

export type ProfileDraft = Pick<UserProfile, 'documentId' | 'email' | 'phone' | 'address'>

export type AppModule = {
  id: number
  code: string
  label: string
  description: string
  to: string | null
  icon: string
  parentId: number | null
  order: number
}

export type ModuleNode = {
  id: number
  code: string
  label: string
  description: string
  to: string | null
  icon: string
  parentId: number | null
  granted: boolean
  children: ModuleNode[]
}

export type Role = {
  id: number
  name: string
  description: string
  active: boolean
}

export type RoleDetail = Role & {
  moduleIds: number[]
  permissionCodes: string[]
  tree: ModuleNode[]
}

export type ManagedUser = {
  id: number
  fullName: string
  nombres: string
  apellidos: string
  documentType: string
  documentId: string
  email: string
  role: string
  roleId: number
  trainingCenter: string
  trainingCenterId: number
  location: string
  active: boolean
  bodegaIds?: number[]
  bodegas?: Array<{ id: number; name: string }>
}

export type UserFormOptions = {
  roles: Array<{ id: number; name: string }>
  centers: Array<{ id: number; name: string; regional: string }>
  bodegas: Array<{ id: number; name: string; trainingCenterId: number }>
}
