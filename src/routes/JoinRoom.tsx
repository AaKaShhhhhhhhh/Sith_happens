import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Scene } from '../components/ui/Scene'
import { PixelButton } from '../components/ui/PixelButton'
import { joinRoom } from '../lib/game'
import { getPlayerId, savePlayerId } from '../lib/identity'

export default function JoinRoom() {
  const { roomCode = '' } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // already joined on this device? go straight to the private role screen
  useEffect(() => {
    const existing = getPlayerId(roomCode)
    if (existing) navigate(`/room/${roomCode}/player/${existing}`, { replace: true })
  }, [roomCode, navigate])

  async function submit() {
    const n = name.trim()
    const e = email.trim()
    if (!n) return setError('Enter a name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return setError('Enter a valid email.')
    setBusy(true)
    setError(null)
    try {
      const { player } = await joinRoom(roomCode, n, e)
      savePlayerId(roomCode, player.id)
      navigate(`/room/${roomCode}/player/${player.id}`, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <Scene variant="day">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1 className="h-title text-2xl text-orange">JOIN GAME</h1>
        <div className="panel w-80 max-w-full">
          <p className="font-body text-xl text-ink/70">
            Room <span className="font-display text-orange">{roomCode}</span>
          </p>

          <label className="font-body mt-4 block text-xl">Your name</label>
          <input
            className="pixel-input mt-1"
            placeholder="e.g. Ananya"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="font-body mt-4 block text-xl">Email</label>
          <input
            className="pixel-input mt-1"
            placeholder="you@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          {error && <p className="font-body mt-3 text-xl text-danger">{error}</p>}

          <PixelButton
            variant="green"
            className="mt-5 w-full"
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'JOINING…' : 'JOIN'}
          </PixelButton>
        </div>
      </div>
    </Scene>
  )
}
