import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

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
      <label htmlFor={id} className="text-sm font-medium text-sena-text/75">
        {label}
      </label>
      <input
        id={id}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        className={cn(
          'h-11 w-full rounded-lg border border-transparent bg-sena-muted px-3.5 text-sm text-sena-text',
          'outline-none transition duration-150',
          'placeholder:text-sena-text/40',
          'focus:border-sena focus:bg-white focus:ring-2 focus:ring-sena/20',
          readOnly && 'cursor-default focus:border-transparent focus:bg-sena-muted focus:ring-0',
          className,
        )}
        {...props}
      />
    </div>
  )
}
