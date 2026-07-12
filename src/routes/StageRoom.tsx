import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Scene } from '../components/ui/Scene'
import { StageLobby } from '../components/stage/StageLobby'
import { StageCrimeBoard } from '../components/stage/StageCrimeBoard'
import { StageVote } from '../components/stage/StageVote'
import { StageReveal } from '../components/stage/StageReveal'
import { useRoom } from '../lib/useRoom'
import { isSupabaseConfigured } from '../lib/supabase'
import { advancePhase, revealNextClue, startGame } from '../lib/game'

export default function StageRoom() {
  const { roomCode } = useParams()
  const { room, players, interrogations, votes, loading, error } = useRoom(roomCode)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (!isSupabaseConfigured) {
    return (
      <Scene variant="night">
        <div className="flex flex-1 items-center justify-center">
          <div className="panel max-w-md text-center">
            <p className="font-display text-sm text-danger">Backend not configured</p>
            <p className="font-body mt-3 text-xl">
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload.
            </p>
          </div>
        </div>
      </Scene>
    )
  }

  if (loading) {
    return (
      <Scene variant="day">
        <div className="flex flex-1 items-center justify-center">
          <p className="font-display text-sm text-ink">Loading…</p>
        </div>
      </Scene>
    )
  }

  if (error || !room) {
    return (
      <Scene variant="day">
        <div className="flex flex-1 items-center justify-center">
          <div className="panel text-center">
            <p className="font-display text-sm text-danger">Room not found</p>
          </div>
        </div>
      </Scene>
    )
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setActionError(null)
    try {
      await fn()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (room.phase === 'LOBBY') {
    return (
      <Scene variant="day">
        <StageLobby
          room={room}
          players={players}
          starting={busy}
          error={actionError}
          onStart={() => run(() => startGame(room))}
        />
      </Scene>
    )
  }

  if (
    room.phase === 'ROLES_ASSIGNED' ||
    room.phase === 'CASE_INTRO' ||
    room.phase === 'INVESTIGATION'
  ) {
    return (
      <Scene variant="night">
        <StageCrimeBoard
          room={room}
          players={players}
          interrogations={interrogations}
          busy={busy}
          onAdvance={() => run(() => advancePhase(room))}
          onRevealClue={() => run(() => revealNextClue(room))}
        />
      </Scene>
    )
  }

  if (room.phase === 'VOTING') {
    return (
      <Scene variant="night">
        <StageVote
          room={room}
          players={players}
          votes={votes}
          busy={busy}
          onReveal={() => run(() => advancePhase(room))}
        />
      </Scene>
    )
  }

  // REVEAL or COMPLETED
  return (
    <Scene variant="night">
      <StageReveal room={room} players={players} votes={votes} />
    </Scene>
  )
}
