export const SUSPECT_IDS = ["cto", "intern", "senior_dev"] as const;
export type SuspectId = (typeof SUSPECT_IDS)[number];

export const ROLE_TYPES = ["investigator", "mole", "witness"] as const;
export type RoleType = (typeof ROLE_TYPES)[number];

export const PHASES = [
  "LOBBY",
  "ROLES_ASSIGNED",
  "CASE_INTRO",
  "INVESTIGATION",
  "VOTING",
  "REVEAL",
  "COMPLETED",
] as const;
export type GamePhase = (typeof PHASES)[number];

export const CASE_CLUES = [
  {
    id: "silver_macbook",
    title: "The machine name",
    text: "The deploy came from a machine named silver-macbook.",
  },
  {
    id: "saved_shell_script",
    title: "The command source",
    text: "The command was not typed manually. It came from a saved shell script.",
  },
  {
    id: "temporary_fix_comment",
    title: "The comment",
    text: "The script contained a comment: “temporary fix, delete after demo.”",
  },
  {
    id: "offboarded_token",
    title: "The token owner",
    text: "The access token belonged to someone who was officially offboarded last week.",
  },
] as const;

export const WITNESS_CLUE =
  "You saw a Slack message at 1:58 AM: “If they won’t respect my architecture, they can enjoy rebuilding it.”";

export const MOLE_OBJECTIVE =
  "Your goal is to make the group accuse the Intern. Push the idea that “temporary fix, delete after demo” sounds like intern behavior. Do not be obvious.";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(random = Math.random, length = 5) {
  return Array.from({ length }, () => ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length) % ROOM_CODE_ALPHABET.length]).join("");
}

export const PRESET_QUESTIONS = [
  { id: "where_were_you", text: "Where were you at 2:13 AM?" },
  { id: "why_access", text: "Why did you still have database access?" },
  { id: "script_comment", text: "Who writes comments like “temporary fix, delete after demo”?" },
] as const;

const ANSWERS: Record<SuspectId, Record<string, string>> = {
  cto: {
    where_were_you:
      "technically, I was awake reviewing architecture diagrams. That is not the same as touching production.",
    why_access:
      "technically, the CTO should have access to everything. Whether that is wise is a different question.",
    script_comment:
      "That comment is sloppy, but not CTO sloppy. It sounds like someone copying a migration from a doc at 2 AM.",
  },
  intern: {
    where_were_you:
      "I was just following docs and trying not to break anything. Which I realize sounds extremely bad right now.",
    why_access:
      "They gave me a token for onboarding. I thought it was sandbox-only. Please tell me it was sandbox-only.",
    script_comment:
      "I write comments like that in tutorials, not in production. I mean, usually. I think.",
  },
  senior_dev: {
    where_were_you:
      "At 2 AM? Enjoying unemployment and watching the incident channel panic. Allegedly.",
    why_access:
      "If my token still worked after offboarding, that says more about their process than my ethics.",
    script_comment:
      "That comment is old. Very old. The kind of thing management ignores until it becomes a crime scene.",
  },
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function assertSuspectId(value: string): asserts value is SuspectId {
  if (!SUSPECT_IDS.includes(value as SuspectId)) {
    throw new Error(`Invalid suspect id: ${value}`);
  }
}

export function getPresetAnswer(suspectId: SuspectId, questionId: string) {
  const answer = ANSWERS[suspectId][questionId];
  if (!answer) {
    throw new Error(`Invalid question '${questionId}' for suspect '${suspectId}'`);
  }
  return answer;
}

export function randomChoice<T>(items: readonly T[], random = Math.random): T {
  if (items.length === 0) throw new Error("Cannot choose from an empty list");
  return items[Math.floor(random() * items.length) % items.length]!;
}

export function assignRoles(playerIds: string[], random = Math.random) {
  if (playerIds.length < 4) {
    throw new Error("A room needs minimum 4 players to start");
  }

  const remaining = [...playerIds];
  const takeRandom = () => {
    const index = Math.floor(random() * remaining.length) % remaining.length;
    const [id] = remaining.splice(index, 1);
    return id!;
  };

  const molePlayerId = takeRandom();
  const witnessPlayerId = playerIds.length >= 4 ? takeRandom() : undefined;
  const roles: Record<string, RoleType> = Object.fromEntries(playerIds.map((id) => [id, "investigator"]));

  roles[molePlayerId] = "mole";
  if (witnessPlayerId) roles[witnessPlayerId] = "witness";

  return { molePlayerId, witnessPlayerId, roles };
}

export function nextPhase(phase: GamePhase): GamePhase {
  const index = PHASES.indexOf(phase);
  if (index === -1) throw new Error(`Unknown phase: ${phase}`);
  if (phase === "COMPLETED") throw new Error("Room is already completed");
  return PHASES[index + 1]!;
}

export type VoteLike = { suspectId: SuspectId };

export function summarizeVotes(votes: VoteLike[]) {
  const totals: Record<SuspectId, number> = { cto: 0, intern: 0, senior_dev: 0 };
  for (const vote of votes) totals[vote.suspectId] += 1;

  let accusedSuspectId: SuspectId = SUSPECT_IDS[0];
  for (const suspectId of SUSPECT_IDS) {
    if (totals[suspectId] > totals[accusedSuspectId]) accusedSuspectId = suspectId;
  }

  return { totals, accusedSuspectId };
}

export function calculateReveal(input: {
  killerSuspectId: SuspectId;
  molePlayerId?: string;
  votes: VoteLike[];
}) {
  const summary = summarizeVotes(input.votes);
  const investigatorsWon = summary.accusedSuspectId === input.killerSuspectId;

  return {
    ...summary,
    realCulpritId: input.killerSuspectId,
    molePlayerId: input.molePlayerId,
    investigatorsWon,
    moleWon: !investigatorsWon,
  };
}

export function makeVerdictText(input: {
  accusedSuspectId: SuspectId;
  realCulpritId: SuspectId;
  investigatorsWon: boolean;
}) {
  const result = input.investigatorsWon ? "caught the culprit" : "got fooled by the Mole";
  return {
    title: input.investigatorsWon ? "Prod was avenged." : "The Mole got away.",
    shareText: `We accused ${input.accusedSuspectId}, the real culprit was ${input.realCulpritId}, and we ${result} in The Midnight Deploy.`,
  };
}
