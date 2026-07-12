import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'orange' | 'green' | 'red' | 'ghost'

export function PixelButton({
  variant = 'orange',
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, className)}
      {...rest}
    >
      {children}
    </button>
  )
}
