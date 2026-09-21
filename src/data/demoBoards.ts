export type InventoryRow = {
  id: string
  name: string
  category: string
  stock: number
  status: 'Disponible' | 'Agotado'
}

export type WasteRow = {
  id: string
  date: string
  type: string
  quantity: string
  status: 'Reutilizable' | 'No reutilizable'
}

export type ActivityRow = {
  id: string
  title: string
  date: string
  owner: string
  status: 'En curso' | 'Finalizada'
}

export const INVENTORY_ROWS: InventoryRow[] = [
  { id: 'INV-001', name: 'Laptop HP', category: 'Tecnología', stock: 15, status: 'Disponible' },
  { id: 'INV-002', name: 'Rieles de 1x3 10cm', category: 'Tecnología', stock: 8, status: 'Disponible' },
  { id: 'INV-003', name: 'Herramienta manual', category: 'Herramientas', stock: 12, status: 'Disponible' },
  { id: 'INV-004', name: 'Café de especialidad', category: 'Alimentos', stock: 30, status: 'Disponible' },
  { id: 'INV-005', name: 'Guantes de seguridad', category: 'Dotación', stock: 20, status: 'Disponible' },
]

export const WASTE_ROWS: WasteRow[] = [
  { id: '1', date: '2025-06-10', type: 'Plástico', quantity: '15 kg', status: 'Reutilizable' },
  { id: '2', date: '2025-06-09', type: 'Orgánico', quantity: '8 kg', status: 'Reutilizable' },
  { id: '3', date: '2025-06-08', type: 'Reciclable', quantity: '5 kg', status: 'Reutilizable' },
  { id: '4', date: '2025-06-07', type: 'Peligroso', quantity: '3 kg', status: 'No reutilizable' },
  { id: '5', date: '2025-06-06', type: 'Metálico', quantity: '10 kg', status: 'Reutilizable' },
]

export const ACTIVITY_ROWS: ActivityRow[] = [
  { id: '1', title: 'Taller de mantenimiento preventivo', date: '2023-11-15', owner: 'Juan Pérez', status: 'En curso' },
  { id: '2', title: 'Revisión de inventario de equipos', date: '2023-11-10', owner: 'Ana García', status: 'Finalizada' },
  { id: '3', title: 'Capacitación en seguridad laboral', date: '2023-11-08', owner: 'Carlos Rodriguez', status: 'En curso' },
  { id: '4', title: 'Planificación trimestral de equipos', date: '2023-11-25', owner: 'Andres López', status: 'En curso' },
  { id: '5', title: 'Planificación trimestral de proyectos', date: '2023-10-25', owner: 'Sofia Torres', status: 'Finalizada' },
]

export const MATERIAL_ROWS: InventoryRow[] = [
  { id: 'MAT-001', name: 'Guía de aprendizaje', category: 'Documentos', stock: 40, status: 'Disponible' },
  { id: 'MAT-002', name: 'Kit de prácticas', category: 'Talleres', stock: 18, status: 'Disponible' },
  { id: 'MAT-003', name: 'Manual de seguridad', category: 'Documentos', stock: 22, status: 'Disponible' },
]
