import type { GamePhase, RoleType, SuspectId } from "./gameLogic";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Room = {
  id: string;
  code: string;
  host_name: string | null;
  phase: GamePhase;
  killer_suspect_id: SuspectId | null;
  mole_player_id: string | null;
  witness_player_id: string | null;
  current_clue_index: number;
  created_at: string;
  started_at: string | null;
  voting_started_at: string | null;
  revealed_at: string | null;
  completed_at: string | null;
  parent_room_code: string | null;
  spawned_rooms_count: number;
};

export type Player = {
  id: string;
  room_id: string;
  name: string;
  email: string;
  role: RoleType | null;
  joined_at: string;
  role_viewed_at: string | null;
  voted_at: string | null;
  verdict_shared_at: string | null;
  user_agent: string | null;
};

export type Vote = {
  id: string;
  room_id: string;
  player_id: string;
  suspect_id: SuspectId;
  created_at: string;
  updated_at: string | null;
};

export type Event = {
  id: string;
  room_id: string | null;
  player_id: string | null;
  type: string;
  payload: Json | null;
  created_at: string;
};

export type Interrogation = {
  id: string;
  room_id: string;
  player_id: string | null;
  suspect_id: SuspectId;
  question_id: string;
  answer_text: string;
  audio_url: string | null;
  created_at: string;
};

export type VerdictCard = {
  id: string;
  room_id: string;
  player_id: string | null;
  title: string;
  share_text: string;
  image_url: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      rooms: { Row: Room; Insert: Partial<Room> & Pick<Room, "code" | "phase">; Update: Partial<Room> };
      players: { Row: Player; Insert: Partial<Player> & Pick<Player, "room_id" | "name" | "email">; Update: Partial<Player> };
      votes: { Row: Vote; Insert: Partial<Vote> & Pick<Vote, "room_id" | "player_id" | "suspect_id">; Update: Partial<Vote> };
      events: { Row: Event; Insert: Partial<Event> & Pick<Event, "type">; Update: Partial<Event> };
      interrogations: { Row: Interrogation; Insert: Partial<Interrogation> & Pick<Interrogation, "room_id" | "suspect_id" | "question_id" | "answer_text">; Update: Partial<Interrogation> };
      verdict_cards: { Row: VerdictCard; Insert: Partial<VerdictCard> & Pick<VerdictCard, "room_id" | "title" | "share_text">; Update: Partial<VerdictCard> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
