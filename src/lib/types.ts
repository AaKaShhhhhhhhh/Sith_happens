import type { Role, SuspectId } from '../content/case'

export type Phase =
  | 'LOBBY'
  | 'ROLES_ASSIGNED'
  | 'CASE_INTRO'
  | 'INVESTIGATION'
  | 'VOTING'
  | 'REVEAL'
  | 'COMPLETED'

export const PHASE_ORDER: Phase[] = [
  'LOBBY',
  'ROLES_ASSIGNED',
  'CASE_INTRO',
  'INVESTIGATION',
  'VOTING',
  'REVEAL',
  'COMPLETED',
]

// Rows mirror the DB (snake_case) to avoid a mapping layer.
export interface Room {
  id: string
  code: string
  phase: Phase
  killer_suspect_id: SuspectId | null
  mole_player_id: string | null
  witness_player_id: string | null
  current_clue_index: number
  created_at: string
  started_at: string | null
  voting_started_at: string | null
  revealed_at: string | null
  parent_room_code: string | null
  spawned_rooms_count: number
}

export interface Player {
  id: string
  room_id: string
  name: string
  email: string
  role: Role | null
  color_index: number
  is_host: boolean
  ready: boolean
  joined_at: string
  role_viewed_at: string | null
  voted_at: string | null
  verdict_shared_at: string | null
}

export interface Vote {
  id: string
  room_id: string
  player_id: string
  suspect_id: SuspectId
  created_at: string
}

export interface Interrogation {
  id: string
  room_id: string
  player_id: string | null
  suspect_id: SuspectId
  question_id: string
  answer_text: string
  audio_url: string | null
  created_at: string
}
