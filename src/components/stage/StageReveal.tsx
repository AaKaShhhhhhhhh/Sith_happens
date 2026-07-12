import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { computeReveal } from '../../lib/game'
import { suspect } from '../../content/case'
import type { Player, Room, Vote } from '../../lib/types'

export function StageReveal({
  room,
  players,
  votes,
}: {
  room: Room
  players: Player[]
  votes: Vote[]
}) {
  const r = computeReveal(room, votes, players)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step < 3) {
      const t = setTimeout(() => setStep((s) => s + 1), 2600)
      return () => clearTimeout(t)
    }
  }, [step])

  const accusedName = r.accused ? suspect(r.accused).name : 'Nobody'
  const culpritName = r.culprit ? suspect(r.culprit).name : '???'

  return (
    <div
      className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 py-8"
      onClick={() => setStep((s) => Math.min(s + 1, 3))}
    >
      {step >= 0 && (
        <div className="role-pop text-center">
          <p className="font-body text-2xl text-white/70">The group accused…</p>
          <p className="font-display mt-2 text-2xl text-white">{accusedName}</p>
        </div>
      )}

      {step >= 1 && (
        <div className="role-pop text-center">
          <p className="font-body text-2xl text-white/70">The real culprit was…</p>
          <p
            className="font-display mt-2 text-3xl"
            style={{ color: r.investigatorsWon ? '#5fbf4f' : '#e23b3b' }}
          >
            {culpritName} {r.investigatorsWon ? '✓' : '✗'}
          </p>
        </div>
      )}

      {step >= 2 && (
        <div className="role-pop text-center">
          <p className="font-body text-2xl text-white/70">The Mole was…</p>
          <p className="font-display mt-2 text-2xl text-danger">{r.moleName ?? '—'}</p>
        </div>
      )}

      {step >= 3 && (
        <div className="role-pop mt-2 flex flex-col items-center">
          <Trophy
            className="h-16 w-16"
            style={{ color: r.investigatorsWon ? '#f1c40f' : '#e23b3b' }}
          />
          <h1
            className="h-title mt-3 text-3xl"
            style={{ color: r.investigatorsWon ? '#5fbf4f' : '#e23b3b' }}
          >
            {r.investigatorsWon ? 'INVESTIGATORS WIN!' : 'THE MOLE WINS!'}
          </h1>
          <p className="font-body mt-4 text-xl text-white/60">
            Players: grab your verdict card on your phone →
          </p>
        </div>
      )}

      {step < 3 && (
        <p className="font-body mt-4 text-lg text-white/40">tap to skip</p>
      )}
    </div>
  )
}
