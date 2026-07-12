import { CASE_CLUES, MOLE_OBJECTIVE, PHASES, PRESET_QUESTIONS, ROLE_TYPES, SUSPECT_IDS, WITNESS_CLUE } from "./gameLogic";

export { CASE_CLUES, MOLE_OBJECTIVE, PHASES, PRESET_QUESTIONS, ROLE_TYPES, SUSPECT_IDS, WITNESS_CLUE };

export function getCase() {
  return {
    intro: [
      "At 2:13 AM, production went down.",
      "At 2:17 AM, the database was wiped.",
      "Three people had access.",
      "One is lying.",
    ],
    suspects: [
      {
        id: "cto",
        name: "The CTO",
        personality: "Calm, overconfident, says “technically” too much.",
        motive: "Wanted to hide a bad architecture decision.",
      },
      {
        id: "intern",
        name: "The Intern",
        personality: "Nervous, overshares, says “I was just following docs.”",
        motive: "Pushed a migration script and panicked.",
      },
      {
        id: "senior_dev",
        name: "The Fired Senior Dev",
        personality: "Bitter, sarcastic, knows too much.",
        motive: "Revenge after being offboarded.",
      },
    ],
    clues: CASE_CLUES,
    witnessClue: WITNESS_CLUE,
    moleObjective: MOLE_OBJECTIVE,
    questions: PRESET_QUESTIONS,
  };
}
