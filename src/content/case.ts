// "The Midnight Deploy" — the one authored case.
// The guilty suspect is chosen at random each game; clues + witness line adapt
// to whoever is guilty so the mystery stays coherent.

export type SuspectId = 'cto' | 'intern' | 'senior_dev'

export interface Suspect {
  id: SuspectId
  name: string
  title: string
  blurb: string
}

export const SUSPECTS: Suspect[] = [
  {
    id: 'cto',
    name: 'The CTO',
    title: 'Chief Technology Officer',
    blurb: 'Calm, overconfident, says "technically" too much.',
  },
  {
    id: 'intern',
    name: 'The Intern',
    title: 'Summer Intern',
    blurb: 'Nervous, overshares, "I was just following the docs."',
  },
  {
    id: 'senior_dev',
    name: 'The Fired Senior Dev',
    title: 'Offboarded Last Week',
    blurb: 'Bitter, sarcastic, knows too much.',
  },
]

export const SUSPECT_IDS: SuspectId[] = ['cto', 'intern', 'senior_dev']

export function suspect(id: SuspectId): Suspect {
  return SUSPECTS.find((s) => s.id === id)!
}

export const CASE_INTRO = [
  'At 2:13 AM, production went down.',
  'At 2:17 AM, the database was wiped.',
  'Three people had access. One is lying.',
]

// ---------- clue ladders (revealed one at a time) ----------
export const CLUES_BY_KILLER: Record<SuspectId, string[]> = {
  cto: [
    'The wipe ran from an admin token — only a senior account could mint one.',
    'The command came from a saved script, not a live typo.',
    "The script was last edited on a machine named 'silver-macbook-pro'.",
    'Only one person carries a silver MacBook to every standup: the CTO.',
  ],
  intern: [
    'The wipe started as a migration script gone wrong, not a manual DROP.',
    'That migration was pushed just 6 minutes before the crash.',
    'The commit was authored from a brand-new laptop still on guest WiFi.',
    'Only the new hire is still on guest WiFi: the intern.',
  ],
  senior_dev: [
    'The access token used was issued months ago and never rotated.',
    "The token belonged to an account flagged 'offboarded' last week.",
    'The login came from outside the office, over VPN, at 2 AM.',
    'Only one person was offboarded last week: the fired senior dev.',
  ],
}

export const CLUE_COUNT = 4

export const WITNESS_CLUE_BY_KILLER: Record<SuspectId, string> = {
  cto: 'You saw the CTO snap their laptop shut when you walked past at 1:55 AM.',
  intern: "At 1:58 AM the intern was muttering 'oh no, oh no' and hiding their screen.",
  senior_dev: "You got a text at 1:50 AM from the fired dev: 'watch what happens tonight.'",
}

// ---------- interrogation ----------
export interface Question {
  id: string
  text: string
}

export const QUESTIONS: Question[] = [
  { id: 'where', text: 'Where were you at 2 AM?' },
  { id: 'access', text: 'Did you have delete access to prod?' },
  { id: 'motive', text: 'Why would anyone wipe the database?' },
  { id: 'alibi', text: 'Who can back up your story?' },
]

type AnswerPair = { innocent: string; guilty: string }

const ANSWERS: Record<SuspectId, Record<string, AnswerPair>> = {
  cto: {
    where: {
      innocent: "Home, asleep. I'm always on call, but I was offline.",
      guilty: 'I was... reviewing architecture. Alone. Technically no one needs to confirm that.',
    },
    access: {
      innocent: 'Of course I have access. I also have the sense not to use it at 2 AM.',
      guilty: "Access isn't the same as action. Let's not conflate the two. Technically.",
    },
    motive: {
      innocent: 'Someone panicking over a bad deploy, maybe. Not me.',
      guilty: 'Motive? None. Unless someone wanted a certain architecture decision to... disappear.',
    },
    alibi: {
      innocent: 'My commit history. I was reviewing PRs till midnight.',
      guilty: "I don't need an alibi. I'm the CTO. ...Why are you all looking at me?",
    },
  },
  intern: {
    where: {
      innocent: 'In bed! I have standup at 9, I do not stay up.',
      guilty: 'I was just testing my migration script — I mean, I was asleep! Mostly asleep.',
    },
    access: {
      innocent: 'Me? I can barely merge to main. No delete access.',
      guilty: "It was still open from the demo. I didn't touch anything! Much.",
    },
    motive: {
      innocent: 'No idea. I love this job, please.',
      guilty: 'I just wanted the demo to work. I was going to fix it after, I swear.',
    },
    alibi: {
      innocent: 'My roommate saw me go to bed. Ask them.',
      guilty: 'Nobody. I was alone. Please stop looking at me like that.',
    },
  },
  senior_dev: {
    where: {
      innocent: 'Out. Celebrating my freedom from this place. Bars have witnesses.',
      guilty: 'Home. Alone. Enjoying not being your problem anymore. Allegedly.',
    },
    access: {
      innocent: 'They revoked my access the day they fired me. Supposedly.',
      guilty: "They said they revoked it. They didn't. Sloppy. Very sloppy of them.",
    },
    motive: {
      innocent: "Sure, I'm bitter. Bitter people still have alibis.",
      guilty: 'You offboarded me over a Slack message. Draw your own conclusions.',
    },
    alibi: {
      innocent: "The bartender. My tab's under my name.",
      guilty: "Why would I need one? ...Fine. No, I don't have one.",
    },
  },
}

export function answerFor(
  suspectId: SuspectId,
  questionId: string,
  isGuilty: boolean,
): string {
  const pair = ANSWERS[suspectId]?.[questionId]
  if (!pair) return '...'
  return isGuilty ? pair.guilty : pair.innocent
}

// ---------- roles ----------
export type Role = 'investigator' | 'mole' | 'witness'

export function roleObjective(
  role: Role,
  killer: SuspectId,
  witnessClue?: string,
): { title: string; body: string; color: string } {
  switch (role) {
    case 'mole':
      return {
        title: 'THE MOLE',
        color: '#e23b3b',
        body: `You know the truth: the culprit is ${suspect(killer).name}. Your job is to make the group accuse SOMEONE ELSE. Blend in. Don't get caught steering.`,
      }
    case 'witness':
      return {
        title: 'WITNESS',
        color: '#3f8fd6',
        body: witnessClue
          ? `${witnessClue} Share it wisely — but they'll doubt you.`
          : 'You saw something. Share it wisely.',
      }
    default:
      return {
        title: 'INVESTIGATOR',
        color: '#5fbf4f',
        body: 'Find who wiped prod. Interrogate the suspects, weigh the clues, and vote for the real culprit.',
      }
  }
}

// ---------- audio manifest (drives the ElevenLabs generator) ----------
export interface AudioLine {
  suspect: SuspectId
  questionId: string
  variant: 'innocent' | 'guilty'
  text: string
  file: string
}

export function audioManifest(): AudioLine[] {
  const out: AudioLine[] = []
  for (const s of SUSPECT_IDS) {
    for (const q of QUESTIONS) {
      for (const variant of ['innocent', 'guilty'] as const) {
        out.push({
          suspect: s,
          questionId: q.id,
          variant,
          text: answerFor(s, q.id, variant === 'guilty'),
          file: `${s}-${q.id}-${variant}.mp3`,
        })
      }
    }
  }
  return out
}
