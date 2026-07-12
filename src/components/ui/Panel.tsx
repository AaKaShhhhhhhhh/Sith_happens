import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export function Panel({
  children,
  tight,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; tight?: boolean }) {
  return (
    <div className={clsx('panel', tight && 'panel-tight', className)} {...rest}>
      {children}
    </div>
  )
}
