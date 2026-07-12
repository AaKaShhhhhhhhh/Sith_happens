import type { createAuthenticatedGameBackend } from "./authenticatedBackend";

export type ApiAction =
  | "createRoom"
  | "getRoomByCode"
  | "joinRoom"
  | "listPlayers"
  | "startRoom"
  | "advancePhase"
  | "revealNextClue"
  | "askQuestion"
  | "castVote"
  | "getVoteSummary"
  | "getReveal"
  | "createVerdictCard"
  | "markVerdictShared";

export type ApiRoute = {
  action: ApiAction;
  params: Record<string, string>;
};

type Backend = ReturnType<typeof createAuthenticatedGameBackend>;

function parts(pathname: string) {
  return pathname.replace(/^\/api\/?/, "").replace(/^\//, "").split("/").filter(Boolean).map(decodeURIComponent);
}

export function resolveApiRoute(method: string, pathname: string): ApiRoute | null {
  const verb = method.toUpperCase();
  const p = parts(pathname);

  if (verb === "POST" && p.join("/") === "rooms") return { action: "createRoom", params: {} };
  if (verb === "POST" && p.join("/") === "players/join") return { action: "joinRoom", params: {} };
  if (verb === "POST" && p.join("/") === "interrogations") return { action: "askQuestion", params: {} };
  if (verb === "POST" && p.join("/") === "votes") return { action: "castVote", params: {} };
  if (verb === "POST" && p.join("/") === "verdict-cards") return { action: "createVerdictCard", params: {} };

  if (p[0] === "rooms" && p[1]) {
    const roomIdOrCode = p[1];
    if (verb === "GET" && p.length === 2) return { action: "getRoomByCode", params: { roomCode: roomIdOrCode } };
    if (verb === "GET" && p[2] === "players") return { action: "listPlayers", params: { roomId: roomIdOrCode } };
    if (verb === "POST" && p[2] === "start") return { action: "startRoom", params: { roomId: roomIdOrCode } };
    if (verb === "POST" && p[2] === "phase") return { action: "advancePhase", params: { roomId: roomIdOrCode } };
    if (verb === "POST" && p[2] === "clues" && p[3] === "reveal") {
      return { action: "revealNextClue", params: { roomId: roomIdOrCode } };
    }
    if (verb === "GET" && p[2] === "votes" && p[3] === "summary") {
      return { action: "getVoteSummary", params: { roomId: roomIdOrCode } };
    }
    if (verb === "GET" && p[2] === "reveal") return { action: "getReveal", params: { roomId: roomIdOrCode } };
  }

  if (verb === "POST" && p[0] === "verdict-cards" && p[1] && p[2] === "share") {
    return { action: "markVerdictShared", params: { cardId: p[1] } };
  }

  return null;
}

export async function dispatchApiRoute(backend: Backend, route: ApiRoute, body: any = {}) {
  switch (route.action) {
    case "createRoom":
      return backend.createRoom(body);
    case "getRoomByCode":
      return backend.getRoomByCode(route.params.roomCode);
    case "joinRoom":
      return backend.joinRoom(body);
    case "listPlayers":
      return backend.listPlayers(route.params.roomId);
    case "startRoom":
      return backend.startRoom(route.params.roomId);
    case "advancePhase":
      return backend.advancePhase(route.params.roomId, body?.toPhase);
    case "revealNextClue":
      return backend.revealNextClue(route.params.roomId);
    case "askQuestion":
      return backend.askQuestion(body);
    case "castVote":
      return backend.castVote(body);
    case "getVoteSummary":
      return backend.getVoteSummary(route.params.roomId);
    case "getReveal":
      return backend.getReveal(route.params.roomId);
    case "createVerdictCard":
      return backend.createVerdictCard(body);
    case "markVerdictShared":
      return backend.markVerdictShared(route.params.cardId);
  }
}
