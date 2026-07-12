import { useState } from 'react'
import clsx from 'clsx'
import { suspect, type SuspectId } from '../../content/case'

const FALLBACK: Record<SuspectId, { emoji: string; bg: string }> = {
  cto: { emoji: '🧑‍💼', bg: '#3f8fd6' },
  intern: { emoji: '😰', bg: '#e6902a' },
  senior_dev: { emoji: '😒', bg: '#e74c3c' },
}

export function SuspectCard({
  id,
  selected,
  onClick,
  compact,
  speaking,
}: {
  id: SuspectId
  selected?: boolean
  onClick?: () => void
  compact?: boolean
  speaking?: boolean
}) {
  const [imgOk, setImgOk] = useState(true)
  const s = suspect(id)
  const fb = FALLBACK[id]
  const size = compact ? 'h-20 w-20' : 'h-28 w-28'

  return (
    <div
      className={clsx(
        'panel flex flex-col items-center gap-2 !p-3 text-center transition-transform',
        onClick && 'cursor-pointer hover:-translate-y-1',
        speaking && 'animate-pulse',
      )}
      style={selected ? { boxShadow: '0 0 0 4px var(--color-orange), 8px 8px 0 0 rgba(0,0,0,.35)' } : undefined}
      onClick={onClick}
    >
      <div
        className={clsx(size, 'flex items-center justify-center border-4 border-ink')}
        style={{ background: imgOk ? '#fff' : fb.bg }}
      >
        {imgOk ? (
          <img
            src={`/sprites/suspect-${id}.png`}
            alt={s.name}
            className="h-full w-full object-contain"
            onError={() => setImgOk(false)}
          />
        ) : (
          <span style={{ fontSize: compact ? '2.2rem' : '3rem' }}>{fb.emoji}</span>
        )}
      </div>
      <p className="font-display text-xs leading-tight">{s.name}</p>
      {!compact && <p className="font-body text-base text-ink/60">{s.title}</p>}
    </div>
  )
}
