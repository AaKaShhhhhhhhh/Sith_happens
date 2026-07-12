import { describe, expect, it } from "vitest";
import { resolveApiRoute } from "../src/http";

describe("Vercel API route resolver", () => {
  it.each([
    ["POST", "/api/rooms", { action: "createRoom", params: {} }],
    ["GET", "/api/rooms/ABC12", { action: "getRoomByCode", params: { roomCode: "ABC12" } }],
    ["GET", "/api/rooms/room-id/players", { action: "listPlayers", params: { roomId: "room-id" } }],
    ["POST", "/api/players/join", { action: "joinRoom", params: {} }],
    ["POST", "/api/rooms/room-id/start", { action: "startRoom", params: { roomId: "room-id" } }],
    ["POST", "/api/rooms/room-id/phase", { action: "advancePhase", params: { roomId: "room-id" } }],
    ["POST", "/api/rooms/room-id/clues/reveal", { action: "revealNextClue", params: { roomId: "room-id" } }],
    ["POST", "/api/interrogations", { action: "askQuestion", params: {} }],
    ["POST", "/api/votes", { action: "castVote", params: {} }],
    ["GET", "/api/rooms/room-id/votes/summary", { action: "getVoteSummary", params: { roomId: "room-id" } }],
    ["GET", "/api/rooms/room-id/reveal", { action: "getReveal", params: { roomId: "room-id" } }],
    ["POST", "/api/verdict-cards", { action: "createVerdictCard", params: {} }],
    ["POST", "/api/verdict-cards/card-id/share", { action: "markVerdictShared", params: { cardId: "card-id" } }],
  ])("maps %s %s", (method, path, expected) => {
    expect(resolveApiRoute(method, path)).toEqual(expected);
  });

  it("returns null for unsupported routes", () => {
    expect(resolveApiRoute("DELETE", "/api/rooms/ABC12")).toBeNull();
    expect(resolveApiRoute("GET", "/api/nope")).toBeNull();
  });
});
