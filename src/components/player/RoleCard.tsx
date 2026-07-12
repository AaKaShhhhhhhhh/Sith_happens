import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { roleObjective, type Role, type SuspectId } from '../../content/case'

export function RoleCard({
  role,
  killer,
  witnessClue,
  onRevealed,
}: {
  role: Role
  killer: SuspectId
  witnessClue?: string
  onRevealed?: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const obj = roleObjective(role, killer, witnessClue)

  useEffect(() => {
    if (flipped) onRevealed?.()
  }, [flipped, onRevealed])

  return (
    <div className="flip h-96 w-72 max-w-full" onClick={() => setFlipped(true)}>
      <div className={clsx('flip-inner', flipped && 'is-flipped')}>
        {/* face down */}
        <div className="flip-face panel !bg-night-2 cursor-pointer">
          <div className="font-display text-5xl text-orange">?</div>
          <p className="font-body mt-6 px-6 text-center text-2xl text-white/80">
            Tap to reveal your secret role
          </p>
        </div>

        {/* revealed */}
        <div
          className="flip-face flip-back panel text-center"
          style={{ borderColor: obj.color }}
        >
          <div className="role-pop">
            <p
              className="font-display text-2xl"
              style={{ color: obj.color, textShadow: '2px 2px 0 rgba(0,0,0,.3)' }}
            >
              {obj.title}
            </p>
          </div>
          <p className="font-body mt-5 px-4 text-2xl leading-tight text-ink">
            {obj.body}
          </p>
          <p className="font-body mt-6 text-lg text-ink/50">Keep this secret 🤫</p>
        </div>
      </div>
    </div>
  )
}
