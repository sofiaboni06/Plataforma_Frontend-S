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
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        className={cn('form-field', readOnly && 'form-static cursor-default', className)}
        {...props}
      />
    </div>
  )
}
