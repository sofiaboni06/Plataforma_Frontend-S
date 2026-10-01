import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

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
    'bg-sena text-white shadow-brand transition duration-200 hover:-translate-y-0.5 hover:bg-sena-bright hover:shadow-[0_16px_30px_rgba(0,166,81,0.32)] focus-visible:ring-sena disabled:hover:translate-y-0 disabled:hover:bg-sena disabled:hover:shadow-none',
  secondary:
    'border border-sena-line bg-glass-strong text-sena-dark shadow-hairline backdrop-blur-glass-sm hover:border-sena/45 hover:bg-white/90 hover:text-sena-dark focus-visible:ring-sena',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-10 gap-2 rounded-xl px-5 text-sm',
  md: 'h-[56px] gap-2.5 rounded-2xl px-8 text-[0.9375rem]',
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
