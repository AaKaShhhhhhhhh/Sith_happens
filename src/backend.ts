import type { AppSupabaseClient } from "./supabaseClient";
import {
  CASE_CLUES,
  assignRoles,
  calculateReveal,
  generateRoomCode,
  getPresetAnswer,
  makeVerdictText,
  nextPhase,
  normalizeEmail,
  randomChoice,
  summarizeVotes,
  validateEmail,
  type GamePhase,
  type SuspectId,
} from "./gameLogic";

type EventType =
  | "room_created"
  | "player_joined"
  | "role_viewed"
  | "game_started"
  | "phase_advanced"
  | "clue_revealed"
  | "interrogation_asked"
  | "vote_cast"
  | "reveal_seen"
  | "verdict_generated"
  | "verdict_shared";

function must<T>(value: T | null, message: string): T {
  if (!value) throw new Error(message);
  return value;
}

async function one(
  request: PromiseLike<{ data: any; error: { message: string } | null }>,
  message: string,
): Promise<any> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return must(data, message);
}

async function many(request: PromiseLike<{ data: any[] | null; error: { message: string } | null }>): Promise<any[]> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function trackEvent(
  db: AppSupabaseClient,
  input: { roomId?: string; playerId?: string; type: EventType | string; payload?: unknown },
) {
  return one(
    db
      .from("events")
      .insert({ room_id: input.roomId ?? null, player_id: input.playerId ?? null, type: input.type, payload: input.payload ?? null })
      .select("*")
      .single(),
    "Event was not created",
  );
}

export async function createRoom(db: AppSupabaseClient, input: { hostName?: string; parentRoomCode?: string } = {}) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateRoomCode();
    const { data: existing, error: lookupError } = await db.from("rooms").select("id").eq("code", code).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (existing) continue;

    const room = await one(
      db
        .from("rooms")
        .insert({
          code,
          host_name: input.hostName?.trim() || null,
          phase: "LOBBY",
          current_clue_index: 0,
          parent_room_code: input.parentRoomCode ?? null,
          spawned_rooms_count: 0,
        })
        .select("*")
        .single(),
      "Room was not created",
    );

    if (input.parentRoomCode) {
      const parent = await getRoomByCode(db, input.parentRoomCode);
      if (parent) {
        await db
          .from("rooms")
          .update({ spawned_rooms_count: parent.spawned_rooms_count + 1 })
          .eq("id", parent.id);
      }
    }

    await trackEvent(db, { roomId: room.id, type: "room_created", payload: { code, parentRoomCode: input.parentRoomCode } });
    return room;
  }

  throw new Error("Could not generate a unique room code");
}

export async function getRoomByCode(db: AppSupabaseClient, code: string) {
  const { data, error } = await db.from("rooms").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function joinRoom(
  db: AppSupabaseClient,
  input: { roomCode: string; name: string; email: string; userAgent?: string },
) {
  const room = must(await getRoomByCode(db, input.roomCode), "Room not found");
  if (room.phase !== "LOBBY") throw new Error("This game has already started");

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (name.length < 2) throw new Error("Name is required");
  if (!validateEmail(email)) throw new Error("A valid email is required");

  const { data: existing, error: existingError } = await db
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .eq("email", email)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const player = await one(
      db.from("players").update({ name, user_agent: input.userAgent ?? null }).eq("id", existing.id).select("*").single(),
      "Player was not updated",
    );
    return { player, deduped: true };
  }

  const player = await one(
    db
      .from("players")
      .insert({ room_id: room.id, name, email, user_agent: input.userAgent ?? null })
      .select("*")
      .single(),
    "Player was not created",
  );

  await trackEvent(db, { roomId: room.id, playerId: player.id, type: "player_joined", payload: { name, email } });
  return { player, deduped: false };
}

export async function listPlayers(db: AppSupabaseClient, roomId: string) {
  return many(db.from("players").select("*").eq("room_id", roomId).order("joined_at"));
}

export async function startRoom(db: AppSupabaseClient, roomId: string) {
  const room = await one(db.from("rooms").select("*").eq("id", roomId).single(), "Room not found");
  if (room.phase !== "LOBBY") throw new Error("Only lobby rooms can be started");

  const players = await listPlayers(db, roomId);
  const assignment = assignRoles(players.map((player) => player.id));
  const killerSuspectId = randomChoice(["cto", "intern", "senior_dev"] as const);

  await Promise.all(
    players.map((player) => db.from("players").update({ role: assignment.roles[player.id] }).eq("id", player.id)),
  );

  const updated = await one(
    db
      .from("rooms")
      .update({
        phase: "ROLES_ASSIGNED",
        killer_suspect_id: killerSuspectId,
        mole_player_id: assignment.molePlayerId,
        witness_player_id: assignment.witnessPlayerId ?? null,
        started_at: new Date().toISOString(),
      })
      .eq("id", roomId)
      .select("*")
      .single(),
    "Room was not started",
  );

  await trackEvent(db, { roomId, type: "game_started", payload: { playerCount: players.length, killerSuspectId } });
  return updated;
}

export async function advancePhase(db: AppSupabaseClient, roomId: string, toPhase?: GamePhase) {
  const room = await one(db.from("rooms").select("*").eq("id", roomId).single(), "Room not found");
  const phase = toPhase ?? nextPhase(room.phase);
  const patch: Record<string, unknown> = { phase };
  if (phase === "VOTING") patch.voting_started_at = new Date().toISOString();
  if (phase === "REVEAL") patch.revealed_at = new Date().toISOString();
  if (phase === "COMPLETED") patch.completed_at = new Date().toISOString();

  const updated = await one(db.from("rooms").update(patch).eq("id", roomId).select("*").single(), "Room phase was not advanced");
  await trackEvent(db, { roomId, type: "phase_advanced", payload: { from: room.phase, to: phase } });
  return updated;
}

export async function revealNextClue(db: AppSupabaseClient, roomId: string) {
  const room = await one(db.from("rooms").select("*").eq("id", roomId).single(), "Room not found");
  if (room.phase !== "CASE_INTRO" && room.phase !== "INVESTIGATION") {
    throw new Error("Clues can only be revealed during case intro or investigation");
  }

  const nextIndex = room.current_clue_index + 1;
  if (nextIndex > CASE_CLUES.length) throw new Error("All clues have already been revealed");
  const clue = CASE_CLUES[nextIndex - 1];

  await one(
    db.from("rooms").update({ current_clue_index: nextIndex, phase: "INVESTIGATION" }).eq("id", roomId).select("*").single(),
    "Clue was not revealed",
  );
  await trackEvent(db, { roomId, type: "clue_revealed", payload: { clueId: clue.id, clueIndex: nextIndex } });
  return { clueIndex: nextIndex, clue };
}

export async function askQuestion(
  db: AppSupabaseClient,
  input: { roomId: string; playerId?: string; suspectId: SuspectId; questionId: string; audioUrl?: string },
) {
  const room = await one(db.from("rooms").select("*").eq("id", input.roomId).single(), "Room not found");
  if (room.phase !== "CASE_INTRO" && room.phase !== "INVESTIGATION") {
    throw new Error("Questions can only be asked during investigation");
  }

  const answerText = getPresetAnswer(input.suspectId, input.questionId);
  const interrogation = await one(
    db
      .from("interrogations")
      .insert({
        room_id: input.roomId,
        player_id: input.playerId ?? null,
        suspect_id: input.suspectId,
        question_id: input.questionId,
        answer_text: answerText,
        audio_url: input.audioUrl ?? null,
      })
      .select("*")
      .single(),
    "Interrogation was not stored",
  );
  await trackEvent(db, {
    roomId: input.roomId,
    playerId: input.playerId,
    type: "interrogation_asked",
    payload: { suspectId: input.suspectId, questionId: input.questionId },
  });
  return interrogation;
}

export async function castVote(db: AppSupabaseClient, input: { roomId: string; playerId: string; suspectId: SuspectId }) {
  const [room, player] = await Promise.all([
    one(db.from("rooms").select("*").eq("id", input.roomId).single(), "Room not found"),
    one(db.from("players").select("*").eq("id", input.playerId).single(), "Player not found"),
  ]);
  if (player.room_id !== input.roomId) throw new Error("Player not found in room");
  if (room.phase !== "VOTING" && room.phase !== "REVEAL") throw new Error("Voting is not open");

  const vote = await one(
    db
      .from("votes")
      .upsert(
        { room_id: input.roomId, player_id: input.playerId, suspect_id: input.suspectId, updated_at: new Date().toISOString() },
        { onConflict: "room_id,player_id" },
      )
      .select("*")
      .single(),
    "Vote was not stored",
  );

  await db.from("players").update({ voted_at: new Date().toISOString() }).eq("id", input.playerId);
  await trackEvent(db, { roomId: input.roomId, playerId: input.playerId, type: "vote_cast", payload: { suspectId: input.suspectId } });
  return vote;
}

export async function getVoteSummary(db: AppSupabaseClient, roomId: string) {
  const votes = await many(db.from("votes").select("suspect_id").eq("room_id", roomId));
  return summarizeVotes(votes.map((vote) => ({ suspectId: vote.suspect_id as SuspectId })));
}

export async function getReveal(db: AppSupabaseClient, roomId: string) {
  const room = await one(db.from("rooms").select("*").eq("id", roomId).single(), "Room not found");
  if (!room.killer_suspect_id) throw new Error("Room has not started");
  const votes = await many(db.from("votes").select("suspect_id").eq("room_id", roomId));
  return calculateReveal({
    killerSuspectId: room.killer_suspect_id,
    molePlayerId: room.mole_player_id ?? undefined,
    votes: votes.map((vote) => ({ suspectId: vote.suspect_id as SuspectId })),
  });
}

export async function createVerdictCard(
  db: AppSupabaseClient,
  input: { roomId: string; playerId?: string; title?: string; shareText?: string; imageUrl?: string },
) {
  const room = await one(db.from("rooms").select("*").eq("id", input.roomId).single(), "Room not found");
  if (!room.killer_suspect_id) throw new Error("Room has not started");
  const reveal = await getReveal(db, input.roomId);
  const defaults = makeVerdictText({
    accusedSuspectId: reveal.accusedSuspectId,
    realCulpritId: room.killer_suspect_id,
    investigatorsWon: reveal.investigatorsWon,
  });

  const card = await one(
    db
      .from("verdict_cards")
      .insert({
        room_id: input.roomId,
        player_id: input.playerId ?? null,
        title: input.title?.trim() || defaults.title,
        share_text: input.shareText?.trim() || defaults.shareText,
        image_url: input.imageUrl ?? null,
      })
      .select("*")
      .single(),
    "Verdict card was not created",
  );

  await trackEvent(db, { roomId: input.roomId, playerId: input.playerId, type: "verdict_generated", payload: { cardId: card.id } });
  return card;
}

export async function markVerdictShared(db: AppSupabaseClient, cardId: string) {
  const card = await one(db.from("verdict_cards").select("*").eq("id", cardId).single(), "Verdict card not found");
  const verdictSharedAt = new Date().toISOString();
  if (card.player_id) await db.from("players").update({ verdict_shared_at: verdictSharedAt }).eq("id", card.player_id);
  await trackEvent(db, { roomId: card.room_id, playerId: card.player_id ?? undefined, type: "verdict_shared", payload: { cardId } });
  return { cardId, verdictSharedAt };
}
