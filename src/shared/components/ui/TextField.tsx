import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type TextFieldProps = {
  id: string
  label: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>

export default function TextField({
  id,
  label,
  className,
  readOnly,
  ...props
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.8125rem] font-semibold text-sena-dark">
        {label}
      </label>
      <input
        id={id}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        className={cn(
          'h-11 w-full rounded-xl border border-glass-line bg-glass-strong px-3.5 text-sm text-sena-text backdrop-blur-glass-sm',
          'outline-none transition duration-150',
          'placeholder:text-sena-text-soft',
          'hover:bg-white/80',
          'focus:border-sena focus:bg-white/85 focus:shadow-[0_0_0_3px_rgba(0,166,81,0.12)]',
          readOnly &&
            'cursor-default border-transparent bg-white/45 hover:border-transparent hover:bg-white/45 focus:border-transparent focus:bg-white/45 focus:shadow-none',
          className,
        )}
        {...props}
      />
    </div>
  )
}
