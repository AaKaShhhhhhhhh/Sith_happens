import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scene } from '../components/ui/Scene'
import { PixelButton } from '../components/ui/PixelButton'
import { createRoom } from '../lib/game'

export default function Landing() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createGame() {
    setBusy(true)
    setError(null)
    try {
      const parent = new URLSearchParams(window.location.search).get('ref') ?? undefined
      const room = await createRoom(parent)
      navigate(`/room/${room.code}/stage`)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  function joinGame() {
    const code = joinCode.trim().toUpperCase()
    if (code) navigate(`/join/${code}`)
  }

  return (
    <Scene variant="day">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
        <div className="text-center">
          <h1 className="h-title text-3xl text-orange sm:text-5xl">THE MIDNIGHT</h1>
          <h1 className="h-title text-3xl text-danger sm:text-5xl">DEPLOY</h1>
          <p className="font-display mt-4 text-xs text-ink sm:text-sm">
            Sabotage or Survive
          </p>
        </div>

        <PixelButton
          variant="orange"
          className="w-72 text-base"
          onClick={createGame}
          disabled={busy}
        >
          {busy ? 'CREATING…' : 'CREATE GAME'}
        </PixelButton>

        <div className="panel w-80 max-w-full">
          <p className="font-body mb-2 text-2xl">Or join a game...</p>
          <div className="flex gap-2">
            <input
              className="pixel-input"
              placeholder="ROOM CODE"
              value={joinCode}
              maxLength={6}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinGame()}
            />
            <PixelButton variant="green" onClick={joinGame}>
              JOIN
            </PixelButton>
          </div>
        </div>

        {error && (
          <div className="panel !border-danger max-w-sm text-center">
            <p className="font-body text-xl text-danger">{error}</p>
          </div>
        )}

        <p className="font-body text-xl text-ink/80">
          4–8 Players • Find who wiped prod
        </p>
      </div>
    </Scene>
  )
}
