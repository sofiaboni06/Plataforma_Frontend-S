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
    'bg-[#128a45] text-white shadow-[0_8px_18px_rgba(16,120,60,0.22)] transition duration-150 hover:bg-[#0f7a3d] focus-visible:ring-[#128a45] disabled:hover:bg-[#128a45]',
  secondary:
    'border border-[#d5e6dc] bg-white text-[#1b5c40] shadow-none hover:border-[#b7d8c6] hover:bg-[#f4faf6] focus-visible:ring-[#128a45]',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-10 gap-2 rounded-xl px-4 text-sm',
  md: 'h-11 gap-2 rounded-xl px-5 text-sm',
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
