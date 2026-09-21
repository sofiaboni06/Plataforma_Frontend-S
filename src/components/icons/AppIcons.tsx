import type { ReactElement, SVGProps } from 'react'
import type { NavIconName } from '../../constants/navigation'

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10.8 12 4l8 6.8V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1z" />
    </BaseIcon>
  )
}

export function InventoryIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3.8 8.2 12 4.2l8.2 4" />
      <path d="M3.8 8.2v7.6L12 20l8.2-4.2V8.2" />
      <path d="M12 12.2V20" />
      <path d="m7.5 10.2 4.5 2.2 4.5-2.2" />
    </BaseIcon>
  )
}

export function LeafIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 19.2C5 11.8 11.2 5 20 5 20 13.8 13.8 20 5.6 20" />
      <path d="M8.2 15.8C10 12.5 13.2 9.6 17 8" />
    </BaseIcon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M8 3.8v3.4M16 3.8v3.4M4 10.5h16" />
    </BaseIcon>
  )
}

export function ReportIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 3.8h6.2L20 9.6V19a1.8 1.8 0 0 1-1.8 1.8H8A1.8 1.8 0 0 1 6.2 19V5.6A1.8 1.8 0 0 1 8 3.8Z" />
      <path d="M14.2 3.8V9h5.6M9.2 13.2h5.6M9.2 16.6h3.6" />
    </BaseIcon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.2 19.4c1.4-3.4 3.8-5 6.8-5s5.4 1.6 6.8 5" />
    </BaseIcon>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    </BaseIcon>
  )
}

export function PencilIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0 0-3L18.5 4.5a2.1 2.1 0 0 0-3 0L4 16v4Z" />
      <path d="m13.8 6.2 4 4" />
    </BaseIcon>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </BaseIcon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 6 18 18M18 6 6 18" />
    </BaseIcon>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M15 5h3.2A1.8 1.8 0 0 1 20 6.8v10.4A1.8 1.8 0 0 1 18.2 19H15" />
      <path d="m10 8-4 4 4 4M6 12h11" />
    </BaseIcon>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </BaseIcon>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </BaseIcon>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 3 21 21" />
      <path d="M9.9 5.2C10.6 5 11.3 5 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-3.2 3.8" />
      <path d="M6.5 7.4A16 16 0 0 0 2.5 12s3.5 6.5 9.5 6.5c1.1 0 2.1-.2 3.1-.5" />
    </BaseIcon>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 7h14" />
      <path d="M10 7V5h4v2" />
      <path d="M8 7v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
    </BaseIcon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </BaseIcon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </BaseIcon>
  )
}

const NAV_ICONS = {
  home: HomeIcon,
  inventory: InventoryIcon,
  leaf: LeafIcon,
  calendar: CalendarIcon,
  report: ReportIcon,
  user: UserIcon,
  settings: SettingsIcon,
} as const satisfies Record<NavIconName, (props: IconProps) => ReactElement>

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = NAV_ICONS[name]
  return <Icon className={className} />
}
