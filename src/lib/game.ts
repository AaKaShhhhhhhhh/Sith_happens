import { requireSupabase } from './supabase'
import { makeRoomCode } from './roomCode'
import { PHASE_ORDER, type Interrogation, type Phase, type Player, type Room, type Vote } from './types'
import {
  answerFor,
  CLUE_COUNT,
  SUSPECT_IDS,
  type SuspectId,
} from '../content/case'

/** Minimum players to start (kept low for demos; the pitch targets 4–8). */
export const MIN_PLAYERS = 3

// ------------------------------------------------------------------ events
export async function trackEvent(
  type: string,
  roomId?: string,
  playerId?: string,
  payload?: unknown,
) {
  try {
    await requireSupabase()
      .from('events')
      .insert({ type, room_id: roomId ?? null, player_id: playerId ?? null, payload })
  } catch {
    // analytics/proof events are best-effort
  }
}

// ------------------------------------------------------------------ rooms
export async function createRoom(parentRoomCode?: string): Promise<Room> {
  const sb = requireSupabase()
  // retry a couple of times on the rare code collision
  for (let i = 0; i < 4; i++) {
    const code = makeRoomCode()
    const { data, error } = await sb
      .from('rooms')
      .insert({ code, phase: 'LOBBY', parent_room_code: parentRoomCode ?? null })
      .select()
      .single()
    if (!error && data) {
      await trackEvent('room_created', data.id)
      if (parentRoomCode) {
        // best-effort referral counter on the room that spawned this one
        const parent = await getRoomByCode(parentRoomCode)
        if (parent) {
          await sb
            .from('rooms')
            .update({ spawned_rooms_count: parent.spawned_rooms_count + 1 })
            .eq('id', parent.id)
        }
      }
      return data as Room
    }
  }
  throw new Error('Could not create a room — try again.')
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data } = await requireSupabase()
    .from('rooms')
    .select()
    .eq('code', code.toUpperCase())
    .maybeSingle()
  return (data as Room) ?? null
}

export async function advancePhase(room: Room): Promise<void> {
  const idx = PHASE_ORDER.indexOf(room.phase)
  const next: Phase = PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)]
  const patch: Record<string, unknown> = { phase: next }
  if (next === 'VOTING') patch.voting_started_at = new Date().toISOString()
  if (next === 'REVEAL') patch.revealed_at = new Date().toISOString()
  await requireSupabase().from('rooms').update(patch).eq('id', room.id)
  await trackEvent('phase_' + next.toLowerCase(), room.id)
}

export async function setPhase(roomId: string, phase: Phase): Promise<void> {
  await requireSupabase().from('rooms').update({ phase }).eq('id', roomId)
}

export async function revealNextClue(room: Room): Promise<void> {
  const next = Math.min(room.current_clue_index + 1, CLUE_COUNT)
  await requireSupabase().from('rooms').update({ current_clue_index: next }).eq('id', room.id)
  await trackEvent('clue_revealed', room.id, undefined, { index: next })
}

// ------------------------------------------------------------------ players
export async function listPlayers(roomId: string): Promise<Player[]> {
  const { data } = await requireSupabase()
    .from('players')
    .select()
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
  return (data as Player[]) ?? []
}

export async function joinRoom(
  code: string,
  name: string,
  email: string,
): Promise<{ room: Room; player: Player }> {
  const sb = requireSupabase()
  const room = await getRoomByCode(code)
  if (!room) throw new Error('Room not found.')
  if (room.phase !== 'LOBBY') throw new Error('This game has already started.')

  const normEmail = email.trim().toLowerCase()

  // already joined? return existing player
  const { data: existing } = await sb
    .from('players')
    .select()
    .eq('room_id', room.id)
    .eq('email', normEmail)
    .maybeSingle()
  if (existing) return { room, player: existing as Player }

  const players = await listPlayers(room.id)
  const { data, error } = await sb
    .from('players')
    .insert({
      room_id: room.id,
      name: name.trim().slice(0, 24) || 'Player',
      email: normEmail,
      color_index: players.length,
      is_host: players.length === 0,
      ready: false,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Could not join.')
  await trackEvent('player_joined', room.id, data.id)
  return { room, player: data as Player }
}

export async function setReady(playerId: string, ready: boolean): Promise<void> {
  await requireSupabase().from('players').update({ ready }).eq('id', playerId)
}

export async function markRoleViewed(playerId: string): Promise<void> {
  await requireSupabase()
    .from('players')
    .update({ role_viewed_at: new Date().toISOString() })
    .eq('id', playerId)
  await trackEvent('role_viewed', undefined, playerId)
}

export async function markVerdictShared(playerId: string): Promise<void> {
  await requireSupabase()
    .from('players')
    .update({ verdict_shared_at: new Date().toISOString() })
    .eq('id', playerId)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Host action: lock the culprit + roles and move to ROLES_ASSIGNED. */
export async function startGame(room: Room): Promise<void> {
  const sb = requireSupabase()
  const players = await listPlayers(room.id)
  if (players.length < MIN_PLAYERS) {
    throw new Error(`Need at least ${MIN_PLAYERS} players.`)
  }

  const killer: SuspectId = pick(SUSPECT_IDS)

  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const mole = shuffled[0]
  const witness = players.length >= 5 ? shuffled[1] : undefined

  // assign roles
  for (const p of players) {
    const role =
      p.id === mole.id ? 'mole' : p.id === witness?.id ? 'witness' : 'investigator'
    await sb.from('players').update({ role }).eq('id', p.id)
  }

  await sb
    .from('rooms')
    .update({
      phase: 'ROLES_ASSIGNED',
      killer_suspect_id: killer,
      mole_player_id: mole.id,
      witness_player_id: witness?.id ?? null,
      started_at: new Date().toISOString(),
    })
    .eq('id', room.id)

  await trackEvent('game_started', room.id, undefined, {
    players: players.length,
    killer,
  })
}

// ------------------------------------------------------------------ interrogation
export async function askQuestion(
  room: Room,
  playerId: string | null,
  suspectId: SuspectId,
  questionId: string,
): Promise<Interrogation> {
  const sb = requireSupabase()
  const isGuilty = room.killer_suspect_id === suspectId
  const answerText = answerFor(suspectId, questionId, isGuilty)
  const variant = isGuilty ? 'guilty' : 'innocent'
  const audioUrl = `/audio/${suspectId}-${questionId}-${variant}.mp3`
  const { data, error } = await sb
    .from('interrogations')
    .insert({
      room_id: room.id,
      player_id: playerId,
      suspect_id: suspectId,
      question_id: questionId,
      answer_text: answerText,
      audio_url: audioUrl,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Interrogation failed.')
  await trackEvent('interrogation_asked', room.id, playerId ?? undefined, {
    suspectId,
    questionId,
  })
  return data as Interrogation
}

// ------------------------------------------------------------------ votes
export async function castVote(
  room: Room,
  playerId: string,
  suspectId: SuspectId,
): Promise<void> {
  const sb = requireSupabase()
  await sb
    .from('votes')
    .upsert(
      { room_id: room.id, player_id: playerId, suspect_id: suspectId },
      { onConflict: 'room_id,player_id' },
    )
  await sb.from('players').update({ voted_at: new Date().toISOString() }).eq('id', playerId)
  await trackEvent('vote_cast', room.id, playerId, { suspectId })
}

export async function listVotes(roomId: string): Promise<Vote[]> {
  const { data } = await requireSupabase().from('votes').select().eq('room_id', roomId)
  return (data as Vote[]) ?? []
}

export interface Reveal {
  accused: SuspectId | null
  culprit: SuspectId | null
  moleName: string | null
  investigatorsWon: boolean
  tally: Record<SuspectId, number>
}

export function computeReveal(room: Room, votes: Vote[], players: Player[]): Reveal {
  const tally = { cto: 0, intern: 0, senior_dev: 0 } as Record<SuspectId, number>
  for (const v of votes) tally[v.suspect_id] = (tally[v.suspect_id] ?? 0) + 1

  let accused: SuspectId | null = null
  let best = -1
  for (const id of SUSPECT_IDS) {
    if (tally[id] > best) {
      best = tally[id]
      accused = id
    }
  }
  if (best <= 0) accused = null

  const culprit = room.killer_suspect_id
  const mole = players.find((p) => p.id === room.mole_player_id) ?? null
  const investigatorsWon = accused != null && accused === culprit

  return { accused, culprit, moleName: mole?.name ?? null, investigatorsWon, tally }
}
