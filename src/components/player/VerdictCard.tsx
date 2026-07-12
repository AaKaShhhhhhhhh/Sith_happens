import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toPng } from 'html-to-image'
import { Share2 } from 'lucide-react'
import { PixelButton } from '../ui/PixelButton'
import { computeReveal, markVerdictShared, trackEvent } from '../../lib/game'
import { shareOrDownload } from '../../lib/share'
import { suspect } from '../../content/case'
import type { Player, Room, Vote } from '../../lib/types'

export function VerdictCard({
  room,
  players,
  votes,
  me,
}: {
  room: Room
  players: Player[]
  votes: Vote[]
  me: Player
}) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const reveal = computeReveal(room, votes, players)
  const iWon = me.role === 'mole' ? !reveal.investigatorsWon : reveal.investigatorsWon
  const accusedName = reveal.accused ? suspect(reveal.accused).name : 'Nobody'
  const culpritName = reveal.culprit ? suspect(reveal.culprit).name : '???'
  const winColor = reveal.investigatorsWon ? '#3f8a33' : '#a52323'

  async function share() {
    if (!cardRef.current) return
    setBusy(true)
    setStatus(null)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      void trackEvent('verdict_generated', room.id, me.id)
      const res = await shareOrDownload(
        dataUrl,
        'inside-out.png',
        'I just played Inside Out 🕵️ — someone wiped prod at 2 AM. Can your group catch the culprit?',
      )
      void trackEvent('verdict_shared', room.id, me.id, { via: res })
      void markVerdictShared(me.id)
      setStatus(res === 'shared' ? 'Shared!' : 'Saved to your device!')
    } catch {
      setStatus('Could not render the card.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* the exported card */}
      <div ref={cardRef} className="panel w-80 !bg-cream">
        <p className="font-display text-center text-xs text-orange">INSIDE OUT</p>
        <p className="font-body mt-1 text-center text-lg text-ink/60">
          Someone wiped prod at 2 AM.
        </p>

        <div className="mt-4 text-center">
          <p className="font-display text-lg" style={{ color: winColor }}>
            {reveal.investigatorsWon ? 'INVESTIGATORS WIN' : 'THE MOLE WINS'}
          </p>
          <p className="font-body mt-1 text-xl" style={{ color: iWon ? '#3f8a33' : '#a52323' }}>
            {iWon ? 'You survived.' : 'You got played.'}
          </p>
        </div>

        <div className="font-body mt-4 space-y-1 text-xl">
          <p>🩸 Culprit: {culpritName}</p>
          <p>🗳️ We accused: {accusedName}</p>
          <p>🎭 The Mole: {reveal.moleName ?? '—'}</p>
        </div>

        <p className="font-body mt-4 text-center text-lg text-ink/50">
          Room {room.code} · play it with your group →
        </p>
      </div>

      {status && <p className="font-body text-xl text-white/80">{status}</p>}

      <PixelButton variant="green" className="w-72" disabled={busy} onClick={share}>
        <Share2 className="h-4 w-4" /> {busy ? 'RENDERING…' : 'SHARE VERDICT'}
      </PixelButton>
      <PixelButton
        variant="orange"
        className="w-72"
        onClick={() => navigate(`/?ref=${room.code}`)}
      >
        START YOUR OWN GAME
      </PixelButton>
    </div>
  )
}
