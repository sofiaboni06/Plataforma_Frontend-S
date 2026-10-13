import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/* cn de shadcn/ui: une clases y resuelve conflictos de Tailwind. Lo usa chart.tsx. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
