import type { ReactNode } from 'react'
import clsx from 'clsx'

/** Full-screen route background: cheerful "day" or tense "night". */
export function Scene({
  variant = 'day',
  children,
  className,
}: {
  variant?: 'day' | 'night'
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'relative flex min-h-svh w-full flex-col items-center',
        variant === 'day' ? 'scene-day' : 'scene-night',
        className,
      )}
    >
      <div className="relative z-10 flex w-full flex-1 flex-col items-center px-4">
        {children}
      </div>
    </div>
  )
}
