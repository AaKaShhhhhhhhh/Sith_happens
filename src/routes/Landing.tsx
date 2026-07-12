import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play,
  ArrowRight,
  Users,
  MessageSquare,
  Gavel,
  Search,
  Ghost,
  Eye,
} from 'lucide-react'
import { createRoom } from '../lib/game'
import { SUSPECTS } from '../content/case'

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
    <div className="font-ui min-h-svh bg-night text-white">
      {/* ---------- nav ---------- */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-night/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <span className="font-display text-[0.7rem] text-orange">
            🕵️ INSIDE OUT
          </span>
          <button
            onClick={createGame}
            disabled={busy}
            className="rounded-lg bg-orange px-4 py-2 text-sm font-bold text-night transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Starting…' : 'Play now'}
          </button>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: "center / cover no-repeat url('/sprites/bg-server.png')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/60 via-night/85 to-night" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-block rounded-full border border-orange/40 bg-orange/10 px-3 py-1 text-xs font-semibold text-orange">
              🎉 A party game for builders
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Someone wiped{' '}
              <span className="text-danger">prod</span> at{' '}
              <span className="text-orange">2 AM.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/70">
              A Jackbox-style murder mystery for your group chat. Interrogate three AI
              suspects, unmask the secret mole, and vote on who did it — all in about 12
              minutes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={createGame}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3.5 text-base font-bold text-night shadow-lg shadow-orange/20 transition hover:brightness-110 disabled:opacity-60"
              >
                <Play className="h-5 w-5" fill="currentColor" />
                {busy ? 'Starting…' : 'Create a game'}
              </button>
              <div className="flex overflow-hidden rounded-xl border border-white/15 bg-white/5">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinGame()}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  className="w-32 bg-transparent px-4 py-3.5 text-base tracking-widest outline-none placeholder:text-white/40"
                />
                <button
                  onClick={joinGame}
                  className="bg-white/10 px-4 text-sm font-bold transition hover:bg-white/20"
                >
                  Join
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <p className="mt-6 text-sm text-white/40">
              4–8 players • No app install • Play from any phone
            </p>
          </div>

          {/* suspect lineup */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
              <p className="font-display text-[0.6rem] text-white/50">SUSPECTS</p>
              <div className="mt-4 flex items-end justify-center gap-2">
                {SUSPECTS.map((s) => (
                  <img
                    key={s.id}
                    src={`/sprites/suspect-${s.id}.png`}
                    alt={s.name}
                    className="w-1/3 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-danger/15 px-4 py-3 text-center">
                <span className="font-display text-[0.6rem] text-danger">
                  ⚠ DATABASE WIPED — ONE OF THEM IS LYING
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- suspects ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
          Meet the suspects
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-white/60">
          Grill them from your phone. They answer out loud — and the guilty one always
          slips up.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {SUSPECTS.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition hover:-translate-y-1 hover:border-orange/40"
            >
              <img
                src={`/sprites/suspect-${s.id}.png`}
                alt={s.name}
                className="mx-auto h-40 w-40 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
              <h3 className="font-display mt-3 text-sm text-orange">{s.name}</h3>
              <p className="mt-1 text-sm text-white/40">{s.title}</p>
              <p className="mt-3 text-white/70">{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Join from your phone',
                body: 'Host opens the game on a laptop. Everyone scans the QR and gets a secret role in a private DM.',
              },
              {
                icon: MessageSquare,
                title: 'Interrogate & argue',
                body: 'Question the suspects out loud, read the clues, and figure out who wiped prod — while the mole misleads you.',
              },
              {
                icon: Gavel,
                title: 'Vote & get played',
                body: 'The timer forces a vote. Then the reveal: the real culprit, and the mole who’s been steering you wrong.',
              },
            ].map((step, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-night p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/15 text-orange">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-white/60">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- roles ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
          Everyone gets a secret role
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Search,
              color: '#5fbf4f',
              name: 'Investigator',
              body: 'Most players. Catch the real culprit before the clock runs out.',
            },
            {
              icon: Ghost,
              color: '#e23b3b',
              name: 'The Mole',
              body: 'One player. You know who did it — your job is to make the group blame the wrong person.',
            },
            {
              icon: Eye,
              color: '#3f8fd6',
              name: 'The Witness',
              body: 'You saw one true clue. Drop it at the right moment — if they believe you.',
            },
          ].map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border p-6"
              style={{ borderColor: `${r.color}55`, background: `${r.color}12` }}
            >
              <r.icon className="h-8 w-8" style={{ color: r.color }} />
              <h3 className="font-display mt-4 text-sm" style={{ color: r.color }}>
                {r.name}
              </h3>
              <p className="mt-3 text-white/70">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA band ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-orange/30 bg-gradient-to-br from-orange/20 to-danger/10 px-6 py-14 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Grab your group. Find the culprit.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            One tap to start a room. It’s free, it runs in the browser, and it’s over in
            about 12 minutes.
          </p>
          <button
            onClick={createGame}
            disabled={busy}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange px-8 py-4 text-lg font-bold text-night shadow-lg shadow-orange/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Starting…' : 'Create a game'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-white/40 sm:flex-row">
          <span className="font-display text-[0.6rem] text-white/50">
            🕵️ INSIDE OUT
          </span>
          <span>Built for the GrowthX Hermes Buildathon · Powered by Supabase + ElevenLabs</span>
        </div>
      </footer>
    </div>
  )
}
