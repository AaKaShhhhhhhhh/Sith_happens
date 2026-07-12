import { useState } from 'react'
import { SuspectCard } from '../game/SuspectCard'
import { castVote } from '../../lib/game'
import { SUSPECT_IDS, suspect, type SuspectId } from '../../content/case'
import type { Room } from '../../lib/types'

export function VotePanel({
  room,
  playerId,
  myVote,
}: {
  room: Room
  playerId: string
  myVote: SuspectId | null
}) {
  const [busy, setBusy] = useState(false)

  async function vote(id: SuspectId) {
    setBusy(true)
    try {
      await castVote(room, playerId, id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel w-80 max-w-full">
      <h1 className="h-title text-center text-xl text-danger">WHO WIPED PROD?</h1>
      <div className="mt-4 flex justify-between gap-2">
        {SUSPECT_IDS.map((id) => (
          <SuspectCard
            key={id}
            id={id}
            compact
            selected={myVote === id}
            onClick={() => !busy && vote(id)}
          />
        ))}
      </div>
      {myVote ? (
        <p className="font-body mt-4 text-center text-xl text-ink/80">
          You accused <span className="text-orange">{suspect(myVote).name}</span>. You can
          change it until the reveal.
        </p>
      ) : (
        <p className="font-body mt-4 text-center text-xl text-ink/60">
          Tap a suspect to accuse.
        </p>
      )}
    </div>
  )
}
