import { useEffect, useRef } from 'react'
import { Volume2 } from 'lucide-react'
import { SuspectCard } from '../game/SuspectCard'
import { PixelButton } from '../ui/PixelButton'
import {
  CASE_INTRO,
  CLUES_BY_KILLER,
  CLUE_COUNT,
  QUESTIONS,
  SUSPECT_IDS,
  suspect,
} from '../../content/case'
import type { Interrogation, Player, Room } from '../../lib/types'

export function StageCrimeBoard({
  room,
  players,
  interrogations,
  busy,
  onAdvance,
  onRevealClue,
}: {
  room: Room
  players: Player[]
  interrogations: Interrogation[]
  busy: boolean
  onAdvance: () => void
  onRevealClue: () => void
}) {
  const killer = room.killer_suspect_id
  const clues = killer ? CLUES_BY_KILLER[killer] : []
  const revealed = clues.slice(0, room.current_clue_index)
  const latest = interrogations[interrogations.length - 1]
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (latest?.audio_url && audioRef.current) {
      audioRef.current.src = latest.audio_url
      audioRef.current.play().catch(() => {})
    }
  }, [latest?.id, latest?.audio_url])

  const header = (
    <div className="flex w-full items-center justify-between px-2">
      <span className="badge !bg-orange">{room.phase.replace('_', ' ')}</span>
      <span className="font-body text-xl text-white/80">{players.length} players</span>
    </div>
  )

  // ---- ROLES_ASSIGNED ----
  if (room.phase === 'ROLES_ASSIGNED') {
    return (
      <div className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6">
        {header}
        <h1 className="h-title text-2xl text-orange">ROLES ASSIGNED</h1>
        <p className="font-body text-2xl text-white/80">
          Everyone: check your phone for your secret role.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {SUSPECT_IDS.map((id) => (
            <SuspectCard key={id} id={id} compact />
          ))}
        </div>
        <PixelButton variant="green" disabled={busy} onClick={onAdvance}>
          BEGIN THE CASE
        </PixelButton>
      </div>
    )
  }

  // ---- CASE_INTRO ----
  if (room.phase === 'CASE_INTRO') {
    return (
      <div className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6">
        {header}
        <h1 className="h-title text-2xl text-danger">THE MIDNIGHT DEPLOY</h1>
        <div className="panel max-w-xl text-center">
          {CASE_INTRO.map((line, i) => (
            <p key={i} className="font-body text-2xl leading-snug">
              {line}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {SUSPECT_IDS.map((id) => (
            <SuspectCard key={id} id={id} />
          ))}
        </div>
        <PixelButton variant="orange" disabled={busy} onClick={onAdvance}>
          START INVESTIGATION
        </PixelButton>
      </div>
    )
  }

  // ---- INVESTIGATION ----
  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col gap-5 py-4">
      {header}

      <div className="flex flex-wrap justify-center gap-4">
        {SUSPECT_IDS.map((id) => (
          <SuspectCard key={id} id={id} speaking={latest?.suspect_id === id} />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* clue feed */}
        <div className="panel">
          <p className="font-display text-sm">
            Clues {room.current_clue_index}/{CLUE_COUNT}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {revealed.length === 0 && (
              <p className="font-body text-xl text-ink/60">No clues revealed yet.</p>
            )}
            {revealed.map((c, i) => (
              <div key={i} className="panel !bg-cream-dk !p-2">
                <p className="font-body text-xl">
                  <span className="text-orange">#{i + 1}</span> {c}
                </p>
              </div>
            ))}
          </div>
          {room.current_clue_index < CLUE_COUNT && (
            <PixelButton
              variant="orange"
              className="mt-4 w-full"
              disabled={busy}
              onClick={onRevealClue}
            >
              REVEAL NEXT CLUE
            </PixelButton>
          )}
        </div>

        {/* latest interrogation */}
        <div className="panel">
          <p className="font-display text-sm">Interrogation</p>
          {latest ? (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <p className="font-display text-xs text-orange">
                  {suspect(latest.suspect_id).name}
                </p>
                <button
                  className="btn btn-ghost !p-1.5"
                  onClick={() => audioRef.current?.play().catch(() => {})}
                  aria-label="Replay voice"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <p className="font-body mt-2 text-lg text-ink/60">
                Q: {QUESTIONS.find((q) => q.id === latest.question_id)?.text}
              </p>
              <p className="font-body mt-1 text-2xl leading-tight">“{latest.answer_text}”</p>
            </div>
          ) : (
            <p className="font-body mt-3 text-xl text-ink/60">
              Players: grill a suspect from your phone.
            </p>
          )}
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>

      <div className="flex justify-center">
        <PixelButton variant="red" disabled={busy} onClick={onAdvance}>
          CALL THE VOTE
        </PixelButton>
      </div>
    </div>
  )
}
