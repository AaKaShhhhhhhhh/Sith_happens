import clsx from 'clsx'

/** Pixel timer box. Turns red under `lowAt` seconds. */
export function Timer({ seconds, lowAt = 10 }: { seconds: number; lowAt?: number }) {
  const low = seconds <= lowAt
  return (
    <span className={clsx('timer', low && 'timer-low')}>
      {Math.max(0, Math.ceil(seconds))}s
    </span>
  )
}
