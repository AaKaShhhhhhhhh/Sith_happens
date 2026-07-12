import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check } from 'lucide-react'
import { PixelButton } from '../ui/PixelButton'
import { PlayerChip } from '../ui/PlayerChip'
import { colorForIndex } from '../../lib/colors'
import { MIN_PLAYERS } from '../../lib/game'
import type { Player, Room } from '../../lib/types'

export function StageLobby({
  room,
  players,
  onStart,
  starting,
  error,
}: {
  room: Room
  players: Player[]
  onStart: () => void
  starting: boolean
  error: string | null
}) {
  const [copied, setCopied] = useState(false)
  const joinUrl = `${window.location.origin}/join/${room.code}`

  function copy() {
    void navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
      <h1 className="h-title text-3xl text-orange">LOBBY</h1>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* code + QR */}
        <div className="flex flex-col items-center gap-4">
          <div className="panel flex items-center gap-3">
            <div>
              <p className="font-body text-lg text-ink/70">Room Code:</p>
              <p className="font-display text-2xl text-orange">{room.code}</p>
            </div>
            <button className="btn btn-ghost !p-2" onClick={copy} aria-label="Copy code">
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <div className="panel bg-white !p-3">
            <QRCodeSVG value={joinUrl} size={168} />
          </div>
          <p className="font-body text-lg text-ink/80">Scan to join on your phone</p>
        </div>

        {/* players */}
        <div className="panel w-80 max-w-full">
          <p className="font-display text-sm">
            Players ({players.length}/8)
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {players.map((p) => (
              <PlayerChip
                key={p.id}
                name={p.name}
                color={colorForIndex(p.color_index)}
                isHost={p.is_host}
                isReady={p.ready}
              />
            ))}
            {players.length === 0 && (
              <p className="font-body text-xl text-ink/60">Waiting for players…</p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="font-body text-xl text-danger">{error}</p>}

      <PixelButton
        variant="green"
        className="w-64"
        onClick={onStart}
        disabled={starting || players.length < MIN_PLAYERS}
      >
        {starting
          ? 'STARTING…'
          : players.length < MIN_PLAYERS
            ? `NEED ${MIN_PLAYERS}+`
            : 'START GAME'}
      </PixelButton>
    </div>
  )
}
