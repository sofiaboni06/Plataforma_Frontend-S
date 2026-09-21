import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

type Props = {
  children: ReactNode
  className?: string
  as?: 'button' | 'a'
} & (
  | ButtonHTMLAttributes<HTMLButtonElement>
  | AnchorHTMLAttributes<HTMLAnchorElement>
)

export default function Button({
  children,
  className = '',
  as = 'button',
  ...props
}: Props) {
  const classes = `inline-flex items-center justify-center font-inherit no-underline ${className}`

  if (as === 'a') {
    return (
      <a className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  }

  return (
    <button
      className={classes}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
}