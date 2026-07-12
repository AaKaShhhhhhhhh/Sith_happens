import { authenticateCloudflareRequest, type CloudflareIdentity } from "./cloudflareAuth";
import type { AppSupabaseClient } from "./supabaseClient";
import {
  advancePhase,
  askQuestion,
  castVote,
  createRoom,
  createVerdictCard,
  getReveal,
  getRoomByCode,
  getVoteSummary,
  joinRoom,
  listPlayers,
  markVerdictShared,
  revealNextClue,
  startRoom,
  trackEvent,
} from "./backend";
import type { GamePhase, SuspectId } from "./gameLogic";

type HeaderBag = Headers | Record<string, string | string[] | undefined | null>;

function actorPayload(identity: CloudflareIdentity) {
  return {
    cloudflareUser: {
      email: identity.email,
      name: identity.name,
      userId: identity.userId,
      ip: identity.ip,
    },
  };
}

async function audit(db: AppSupabaseClient, identity: CloudflareIdentity, type: string, payload?: unknown) {
  await trackEvent(db, { type, payload: { ...actorPayload(identity), payload } });
}

export function createAuthenticatedGameBackend(db: AppSupabaseClient, identity: CloudflareIdentity) {
  return {
    identity,
    createRoom: async (input: { hostName?: string; parentRoomCode?: string } = {}) => {
      const room = await createRoom(db, input);
      await audit(db, identity, "cloudflare_room_created", { roomId: room.id, code: room.code });
      return room;
    },
    getRoomByCode: (code: string) => getRoomByCode(db, code),
    joinRoom: (input: { roomCode: string; name: string; email?: string; userAgent?: string }) =>
      joinRoom(db, { ...input, email: input.email ?? identity.email }),
    listPlayers: (roomId: string) => listPlayers(db, roomId),
    startRoom: (roomId: string) => startRoom(db, roomId),
    advancePhase: (roomId: string, toPhase?: GamePhase) => advancePhase(db, roomId, toPhase),
    revealNextClue: (roomId: string) => revealNextClue(db, roomId),
    askQuestion: (input: { roomId: string; playerId?: string; suspectId: SuspectId; questionId: string; audioUrl?: string }) =>
      askQuestion(db, input),
    castVote: (input: { roomId: string; playerId: string; suspectId: SuspectId }) => castVote(db, input),
    getVoteSummary: (roomId: string) => getVoteSummary(db, roomId),
    getReveal: (roomId: string) => getReveal(db, roomId),
    createVerdictCard: (input: { roomId: string; playerId?: string; title?: string; shareText?: string; imageUrl?: string }) =>
      createVerdictCard(db, input),
    markVerdictShared: (cardId: string) => markVerdictShared(db, cardId),
  };
}

export async function createCloudflareAuthenticatedGameBackend(db: AppSupabaseClient, headers: HeaderBag) {
  const identity = await authenticateCloudflareRequest(headers);
  return createAuthenticatedGameBackend(db, identity);
}
