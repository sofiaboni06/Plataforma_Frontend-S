import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary'
type ButtonSize = 'sm' | 'md'

type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-sena text-white hover:bg-[#009247] focus-visible:ring-sena disabled:hover:bg-sena',
  secondary:
    'bg-white text-sena-dark ring-1 ring-inset ring-sena/20 hover:bg-sena-muted focus-visible:ring-sena',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-sm rounded-lg',
  md: 'h-10 gap-2 px-5 text-sm rounded-lg',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    >
      {icon ? <span className="inline-flex size-4 items-center justify-center">{icon}</span> : null}
      <span>{children}</span>
    </button>
  )
}
