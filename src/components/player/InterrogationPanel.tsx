import { useRef, useState } from 'react'
import { SuspectCard } from '../game/SuspectCard'
import { PixelButton } from '../ui/PixelButton'
import { askQuestion } from '../../lib/game'
import { QUESTIONS, SUSPECT_IDS, suspect, type SuspectId } from '../../content/case'
import type { Room } from '../../lib/types'

export function InterrogationPanel({ room, playerId }: { room: Room; playerId: string }) {
  const [target, setTarget] = useState<SuspectId | null>(null)
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<{ suspect: SuspectId; text: string } | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  async function ask(questionId: string) {
    if (!target) return
    setBusy(true)
    try {
      const res = await askQuestion(room, playerId, target, questionId)
      setAnswer({ suspect: target, text: res.answer_text })
      if (res.audio_url && audioRef.current) {
        audioRef.current.src = res.audio_url
        audioRef.current.play().catch(() => {})
      }
    } catch {
      /* surfaced on stage anyway */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel w-80 max-w-full">
      <p className="font-display text-sm">Interrogate</p>

      <div className="mt-3 flex justify-between gap-2">
        {SUSPECT_IDS.map((id) => (
          <SuspectCard
            key={id}
            id={id}
            compact
            selected={target === id}
            onClick={() => setTarget(id)}
          />
        ))}
      </div>

      {target ? (
        <div className="mt-4">
          <p className="font-body text-lg text-ink/70">
            Ask {suspect(target).name}:
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {QUESTIONS.map((q) => (
              <PixelButton
                key={q.id}
                variant="orange"
                className="!text-[0.6rem]"
                disabled={busy}
                onClick={() => ask(q.id)}
              >
                {q.text}
              </PixelButton>
            ))}
          </div>
        </div>
      ) : (
        <p className="font-body mt-3 text-xl text-ink/60">Pick a suspect to question.</p>
      )}

      {answer && (
        <div className="panel !bg-cream-dk mt-4 !p-3">
          <p className="font-display text-xs text-orange">{suspect(answer.suspect).name}</p>
          <p className="font-body mt-1 text-xl leading-tight">“{answer.text}”</p>
        </div>
      )}

      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
