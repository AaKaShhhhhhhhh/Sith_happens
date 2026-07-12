import { PixelButton } from '../ui/PixelButton'
import { SUSPECT_IDS, suspect } from '../../content/case'
import type { Player, Room, Vote } from '../../lib/types'

export function StageVote({
  players,
  votes,
  busy,
  onReveal,
}: {
  room: Room
  players: Player[]
  votes: Vote[]
  busy: boolean
  onReveal: () => void
}) {
  const tally: Record<string, number> = {}
  for (const v of votes) tally[v.suspect_id] = (tally[v.suspect_id] ?? 0) + 1
  const total = players.length || 1

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 py-6">
      <h1 className="h-title text-center text-3xl text-danger">WHO WIPED PROD?</h1>

      <div className="flex flex-col gap-3">
        {SUSPECT_IDS.map((id) => {
          const c = tally[id] ?? 0
          const pct = Math.round((c / total) * 100)
          return (
            <div key={id} className="panel">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs">{suspect(id).name}</span>
                <span className="font-body text-2xl">{c}</span>
              </div>
              <div className="mt-2 h-5 border-4 border-ink bg-cream-dk">
                <div
                  className="h-full bg-orange transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="font-body text-center text-2xl text-white/85">
        {votes.length}/{players.length} voted
      </p>

      <div className="flex justify-center">
        <PixelButton variant="red" disabled={busy} onClick={onReveal}>
          REVEAL THE TRUTH
        </PixelButton>
      </div>
    </div>
  )
}
