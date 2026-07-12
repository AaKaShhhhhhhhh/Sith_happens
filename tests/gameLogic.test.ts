import { describe, expect, it } from "vitest";
import {
  CASE_CLUES,
  SUSPECT_IDS,
  assignRoles,
  calculateReveal,
  generateRoomCode,
  getPresetAnswer,
  nextPhase,
  normalizeEmail,
  summarizeVotes,
  validateEmail,
} from "../src/gameLogic";

describe("game workflow helpers", () => {
  it("normalizes and validates emails", () => {
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
    expect(validateEmail("person@example.com")).toBe(true);
    expect(validateEmail("not-an-email")).toBe(false);
  });

  it("generates readable five-character room codes without ambiguous characters", () => {
    expect(generateRoomCode(() => 0)).toBe("AAAAA");
    expect(generateRoomCode(() => 0.999)).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
  });

  it("assigns exactly one mole, one witness, and investigators to everyone else", () => {
    const playerIds = ["p1", "p2", "p3", "p4", "p5"];
    const assignment = assignRoles(playerIds, () => 0);

    expect(assignment.molePlayerId).toBe("p1");
    expect(assignment.witnessPlayerId).toBe("p2");
    expect(assignment.roles).toEqual({
      p1: "mole",
      p2: "witness",
      p3: "investigator",
      p4: "investigator",
      p5: "investigator",
    });
  });

  it("refuses to start a game with fewer than four players", () => {
    expect(() => assignRoles(["p1", "p2", "p3"], () => 0)).toThrow(/minimum 4/i);
  });

  it("advances only through the documented state machine", () => {
    expect(nextPhase("LOBBY")).toBe("ROLES_ASSIGNED");
    expect(nextPhase("ROLES_ASSIGNED")).toBe("CASE_INTRO");
    expect(nextPhase("CASE_INTRO")).toBe("INVESTIGATION");
    expect(nextPhase("INVESTIGATION")).toBe("VOTING");
    expect(nextPhase("VOTING")).toBe("REVEAL");
    expect(nextPhase("REVEAL")).toBe("COMPLETED");
    expect(() => nextPhase("COMPLETED")).toThrow(/already completed/i);
  });

  it("summarizes votes and deterministically breaks ties by suspect order", () => {
    const summary = summarizeVotes([
      { suspectId: "intern" },
      { suspectId: "cto" },
      { suspectId: "cto" },
      { suspectId: "intern" },
    ]);

    expect(summary.totals).toEqual({ cto: 2, intern: 2, senior_dev: 0 });
    expect(summary.accusedSuspectId).toBe("cto");
  });

  it("calculates investigator and mole win states", () => {
    expect(
      calculateReveal({
        killerSuspectId: "senior_dev",
        molePlayerId: "p1",
        votes: [{ suspectId: "senior_dev" }, { suspectId: "cto" }, { suspectId: "senior_dev" }],
      }),
    ).toMatchObject({ accusedSuspectId: "senior_dev", investigatorsWon: true, moleWon: false });

    expect(
      calculateReveal({
        killerSuspectId: "senior_dev",
        molePlayerId: "p1",
        votes: [{ suspectId: "intern" }, { suspectId: "intern" }, { suspectId: "cto" }],
      }),
    ).toMatchObject({ accusedSuspectId: "intern", investigatorsWon: false, moleWon: true });
  });

  it("keeps case content backend-safe and validates preset interrogation questions", () => {
    expect(SUSPECT_IDS).toEqual(["cto", "intern", "senior_dev"]);
    expect(CASE_CLUES).toHaveLength(4);
    expect(getPresetAnswer("cto", "where_were_you")).toContain("technically");
    expect(() => getPresetAnswer("cto", "unknown_question")).toThrow(/invalid question/i);
  });
});
