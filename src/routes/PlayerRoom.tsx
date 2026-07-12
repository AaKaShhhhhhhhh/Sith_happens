import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Scene } from '../components/ui/Scene'
import { PixelButton } from '../components/ui/PixelButton'
import { RoleCard } from '../components/player/RoleCard'
import { InterrogationPanel } from '../components/player/InterrogationPanel'
import { VotePanel } from '../components/player/VotePanel'
import { VerdictCard } from '../components/player/VerdictCard'
import { useRoom } from '../lib/useRoom'
import { isSupabaseConfigured } from '../lib/supabase'
import { markRoleViewed, setReady } from '../lib/game'
import { colorForIndex } from '../lib/colors'
import { roleObjective, WITNESS_CLUE_BY_KILLER } from '../content/case'

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Scene variant="night">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
        {children}
      </div>
    </Scene>
  )
}

export default function PlayerRoom() {
  const { roomCode, playerId } = useParams()
  const { room, players, votes, loading, error } = useRoom(roomCode)
  const viewedRef = useRef(false)

  if (!isSupabaseConfigured) {
    return (
      <Centered>
        <div className="panel max-w-sm text-center">
          <p className="font-display text-sm text-danger">Backend not configured</p>
        </div>
      </Centered>
    )
  }
  if (loading) return <Centered><p className="font-display text-sm text-white">Loading…</p></Centered>
  if (error || !room) {
    return (
      <Centered>
        <div className="panel text-center">
          <p className="font-display text-sm text-danger">Room not found</p>
        </div>
      </Centered>
    )
  }

  const me = players.find((p) => p.id === playerId)
  if (!me) {
    return (
      <Centered>
        <div className="panel text-center">
          <p className="font-body text-2xl">You're not in this room.</p>
          <p className="font-body mt-2 text-xl text-ink/60">Ask the host for the link.</p>
        </div>
      </Centered>
    )
  }

  const myColor = colorForIndex(me.color_index)

  // ---- LOBBY: waiting + ready toggle ----
  if (room.phase === 'LOBBY') {
    return (
      <Centered>
        <h1 className="h-title text-2xl text-orange">YOU'RE IN</h1>
        <div className="panel w-72 max-w-full text-center">
          <span className="swatch mx-auto" style={{ background: myColor }} />
          <p className="font-body mt-2 text-2xl" style={{ color: myColor }}>
            {me.name}
          </p>
          <p className="font-body mt-4 text-xl text-ink/70">
            Waiting for the host to start…
          </p>
          <PixelButton
            variant={me.ready ? 'green' : 'orange'}
            className="mt-5 w-full"
            onClick={() => setReady(me.id, !me.ready)}
          >
            {me.ready ? 'READY ✓' : 'TAP WHEN READY'}
          </PixelButton>
        </div>
      </Centered>
    )
  }

  // ---- ROLE REVEAL (before investigation) ----
  if (room.phase === 'ROLES_ASSIGNED' || room.phase === 'CASE_INTRO') {
    if (!me.role || !room.killer_suspect_id) {
      return <Centered><p className="font-display text-sm text-white">Assigning roles…</p></Centered>
    }
    const witnessClue =
      me.role === 'witness' ? WITNESS_CLUE_BY_KILLER[room.killer_suspect_id] : undefined
    return (
      <Centered>
        <RoleCard
          role={me.role}
          killer={room.killer_suspect_id}
          witnessClue={witnessClue}
          onRevealed={() => {
            if (!viewedRef.current) {
              viewedRef.current = true
              void markRoleViewed(me.id)
            }
          }}
        />
        <p className="font-body text-xl text-white/70">Watch the big screen for the case.</p>
      </Centered>
    )
  }

  // ---- INVESTIGATION: role banner + interrogation ----
  if (room.phase === 'INVESTIGATION') {
    if (!me.role || !room.killer_suspect_id) {
      return <Centered><p className="font-display text-sm text-white">Loading…</p></Centered>
    }
    const witnessClue =
      me.role === 'witness' ? WITNESS_CLUE_BY_KILLER[room.killer_suspect_id] : undefined
    const obj = roleObjective(me.role, room.killer_suspect_id, witnessClue)
    return (
      <Centered>
        <div
          className="panel w-80 max-w-full text-center !py-3"
          style={{ borderColor: obj.color }}
        >
          <p className="font-display text-xs" style={{ color: obj.color }}>
            {obj.title}
          </p>
          <p className="font-body mt-1 text-lg leading-tight text-ink/70">{obj.body}</p>
        </div>
        <InterrogationPanel room={room} playerId={me.id} />
      </Centered>
    )
  }

  // ---- VOTING ----
  if (room.phase === 'VOTING') {
    const myVote = votes.find((v) => v.player_id === me.id)?.suspect_id ?? null
    return (
      <Centered>
        <VotePanel room={room} playerId={me.id} myVote={myVote} />
      </Centered>
    )
  }

  // ---- REVEAL / COMPLETED: shareable verdict card ----
  return (
    <Centered>
      <VerdictCard room={room} players={players} votes={votes} me={me} />
    </Centered>
  )
}
