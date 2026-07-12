import { Crown, Check } from 'lucide-react'
import clsx from 'clsx'

export function PlayerChip({
  name,
  color,
  isHost,
  isReady,
  isYou,
  voteCount,
  className,
}: {
  name: string
  color: string
  isHost?: boolean
  isReady?: boolean
  isYou?: boolean
  voteCount?: number
  className?: string
}) {
  return (
    <div
      className={clsx(
        'panel-tight panel flex items-center gap-3 !p-2',
        className,
      )}
    >
      <span className="swatch" style={{ background: color }} />
      <span className="font-body flex-1 text-2xl" style={{ color }}>
        {name}
        {isYou && <span className="text-ink/60"> (You)</span>}
      </span>
      {isHost && <Crown className="h-5 w-5 text-orange" />}
      {isReady && <Check className="h-5 w-5 text-leaf" />}
      {voteCount != null && voteCount > 0 && (
        <span className="badge !bg-danger">{voteCount}</span>
      )}
    </div>
  )
}
