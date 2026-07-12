# The Midnight Deploy

**The Midnight Deploy** is a Jackbox-style browser party game for builders and startup teams.

The premise is simple: **someone wiped the production database at 2 AM.**
A group of players joins from their phones, receives secret roles, interrogates AI-powered suspects, drops clues, votes on the culprit, and then gets a dramatic reveal showing whether the group caught the real culprit or got fooled by the secret Mole.

This project is built for the **GrowthX Hermes Buildathon** with **Virality** as the main track.

> ⚡ **To run it, see [SETUP.md](SETUP.md).** The backend is implemented on **Supabase**
> (Postgres + realtime), not Convex as some sections below describe. The rest of this
> document is the original design spec.

---

## Table of Contents

- [Project Summary](#project-summary)
- [Hackathon Strategy](#hackathon-strategy)
- [Core User Flow](#core-user-flow)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Frontend Workflow](#frontend-workflow)
- [Backend Workflow](#backend-workflow)
- [Game State Machine](#game-state-machine)
- [Data Model](#data-model)
- [Routes](#routes)
- [Directory Structure](#directory-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Development Commands](#development-commands)
- [Deployment](#deployment)
- [Virality and Proof Tracking](#virality-and-proof-tracking)
- [MVP Scope](#mvp-scope)
- [Future Improvements](#future-improvements)

---

## Project Summary

**The Midnight Deploy** is a social browser game where:

1. One host creates a game room on a laptop.
2. Players join from their phones using a QR code or room link.
3. Each player enters their name and email.
4. Each player gets a private role:
   - Investigator
   - Mole
   - Witness
5. The stage screen shows a startup-themed mystery:
   > Someone wiped prod at 2 AM.
6. Players interrogate three AI suspects:
   - The CTO
   - The Intern
   - The Fired Senior Dev
7. Clues are revealed during the round.
8. Everyone votes on who wiped prod.
9. The game reveals:
   - who the group accused
   - who the real culprit was
   - who the Mole was
   - whether the Investigators or Mole won
10. Players receive a shareable verdict card.

The goal is to create a fun, viral, screen-recordable party-game moment that can spread through social posts and room invites.

---

## Hackathon Strategy

This project is optimized for the **Virality** track.

The main scoring insight is:

> Playing the game is the signup/action.

Each real player who joins with name/email, receives a role, votes, and gets a verdict card becomes a meaningful action that can be verified by judges.

### Primary scoring targets

| Virality Parameter | Why It Matters |
|---|---|
| Signups/actions | Every real player who joins and completes a game counts as a high-value action |
| Visitors | Landing page and room traffic can be tracked through analytics |
| Reactions/comments | Reveal clips and verdict cards are built to be shared |
| Amplification | The startup/dev theme is designed for builders to repost |
| Impressions | Build-in-public posts, reveal clips, and shared verdict cards drive reach |

### Power-ups

The project can also claim power-up points through:

- **Convex** — realtime game state and database
- **Cloudflare Pages** — public deployment
- **ElevenLabs** — AI suspect voices
- **Hermes** — coding partner and/or game-master content generation

---

## Core User Flow

### Host flow

1. Host opens the landing page.
2. Host clicks **Create Room**.
3. App creates a room in Convex.
4. Host is redirected to the stage screen.
5. Stage screen displays:
   - room code
   - QR code
   - join link
   - live player list
6. Host waits for 4–8 players.
7. Host clicks **Start Game**.
8. Game assigns roles and culprit.
9. Stage shows the crime board.
10. Host controls clue reveals and phase transitions.
11. Stage shows voting results and final reveal.

---

### Player flow

1. Player scans QR code or opens room link.
2. Player enters:
   - display name
   - email
3. Player joins the room.
4. Player receives a private role card.
5. Player participates from phone:
   - views objective
   - asks suspect questions
   - reads private clue if Witness
   - votes for culprit
6. Player sees personal result after reveal.
7. Player downloads or shares verdict card.

---

### Game flow

```text
Landing
  -> Create Room / Join Room
  -> Lobby
  -> Role Assignment
  -> Case Intro
  -> Investigation
  -> Clue Reveals
  -> Voting
  -> Reveal
  -> Verdict Card
  -> Share / Start New Room
```

---

## Tech Stack

### Frontend

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **qrcode.react**
- **html-to-image**
- **lucide-react**

### Backend

- **Convex**
  - realtime database
  - queries
  - mutations
  - game state
  - room/player/vote/event storage

### Hosting

- **Cloudflare Pages**

### Optional / Stretch

- **ElevenLabs**
  - suspect voice generation
  - pre-generated MP3 files
- **PostHog / Plausible / Datafast / Cloudflare Analytics**
  - visitor analytics
  - referral tracking
  - proof for judges

---

## Architecture

```text
Players and Host
      |
      | Browser
      v
Cloudflare Pages
      |
      | serves static React app
      v
React + TypeScript Frontend
      |
      | Convex hooks
      v
Convex Backend
      |
      | stores realtime state
      v
Convex Database

Optional:
React Frontend -> Analytics Provider
React Frontend -> Pre-generated ElevenLabs Audio
Hermes -> Coding partner + case generation proof
```

---

## Frontend Workflow

The frontend is responsible for:

- landing page
- room creation UI
- room joining UI
- stage screen
- player private screen
- role card display
- crime board
- suspect cards
- clue display
- interrogation controls
- vote UI
- reveal animation
- verdict card generation
- analytics events

---

### Frontend screens

#### 1. Landing Page

Route:

```text
/
```

Responsibilities:

- explain the game
- create room
- join existing room
- show main CTA
- support analytics tracking

Main CTA copy:

```text
Someone wiped prod. Find the killer.
```

---

#### 2. Stage Room

Route:

```text
/room/:roomCode/stage
```

Used by the host on laptop/projector.

Responsibilities:

- show room code
- show QR code
- show player lobby
- start game
- show crime board
- show suspects
- show current clue
- show latest interrogation
- show vote results
- show reveal sequence
- show final room verdict

---

#### 3. Join Room

Route:

```text
/join/:roomCode
```

Used by players on phones.

Responsibilities:

- collect name
- collect email
- submit join request
- redirect to private player route

---

#### 4. Player Room

Route:

```text
/room/:roomCode/player/:playerId
```

Used privately by each player.

Responsibilities:

- show role card
- show role objective
- show Witness clue if applicable
- show Mole objective if applicable
- allow suspect interrogation
- allow voting
- show personal result
- show verdict card

---

## Backend Workflow

The backend is powered by **Convex**.

Convex handles:

- room creation
- player joining
- role assignment
- phase transitions
- clue progression
- interrogation event storage
- voting
- reveal calculation
- event tracking
- judge-verifiable proof records

---

### Backend modules

Recommended Convex files:

```text
convex/
├── schema.ts
├── rooms.ts
├── players.ts
├── votes.ts
├── events.ts
├── interrogations.ts
└── case.ts
```

---

### Backend responsibilities

#### `rooms.ts`

Handles:

- creating a room
- fetching a room by code
- starting a game
- assigning killer and roles
- advancing game phase
- revealing clues
- completing game

Core functions:

```ts
createRoom()
getRoomByCode()
startRoom()
advancePhase()
revealNextClue()
completeRoom()
```

---

#### `players.ts`

Handles:

- joining a room
- validating player input
- storing player info
- marking role as viewed
- listing players in a room

Core functions:

```ts
joinRoom()
listPlayers()
getPlayer()
markRoleViewed()
```

---

#### `votes.ts`

Handles:

- vote submission
- preventing duplicate votes
- calculating vote totals
- calculating accused suspect
- calculating winner

Core functions:

```ts
castVote()
getVotes()
getVoteSummary()
getReveal()
```

---

#### `interrogations.ts`

Handles:

- selected suspect
- selected question
- answer text
- optional audio URL
- latest interrogation shown on stage

Core functions:

```ts
askQuestion()
getLatestInterrogation()
listInterrogations()
```

---

#### `events.ts`

Handles proof and analytics events.

Core functions:

```ts
trackEvent()
listRoomEvents()
```

Important events:

```text
room_created
player_joined
role_viewed
game_started
clue_revealed
interrogation_asked
vote_cast
reveal_seen
verdict_generated
verdict_shared
```

---

#### `case.ts`

Stores backend-safe game constants:

- suspect IDs
- clue IDs
- allowed questions
- role types
- phase names

---

## Game State Machine

The game should use a strict phase-based state machine.

```text
LOBBY
  -> ROLES_ASSIGNED
  -> CASE_INTRO
  -> INVESTIGATION
  -> VOTING
  -> REVEAL
  -> COMPLETED
```

### Phase meanings

#### `LOBBY`

Players are joining.
Host sees QR code and player list.

#### `ROLES_ASSIGNED`

Roles and culprit have been locked.
Players can view private role cards.

#### `CASE_INTRO`

Stage introduces the mystery.

#### `INVESTIGATION`

Players interrogate suspects.
Clues are revealed during this phase.

#### `VOTING`

Players vote for one suspect.

#### `REVEAL`

Stage reveals:

- accused suspect
- real culprit
- Mole
- winner

#### `COMPLETED`

Game is finished.
Verdict cards and share CTAs are shown.

---

## Data Model

### `rooms`

Stores one game room.

```ts
{
  code: string;
  hostName?: string;

  phase:
    | "LOBBY"
    | "ROLES_ASSIGNED"
    | "CASE_INTRO"
    | "INVESTIGATION"
    | "VOTING"
    | "REVEAL"
    | "COMPLETED";

  killerSuspectId: "cto" | "intern" | "senior_dev";

  molePlayerId?: Id<"players">;
  witnessPlayerId?: Id<"players">;

  currentClueIndex: number;

  createdAt: number;
  startedAt?: number;
  votingStartedAt?: number;
  revealedAt?: number;

  parentRoomCode?: string;
  spawnedRoomsCount: number;
}
```

---

### `players`

Stores each player who joins a room.

```ts
{
  roomId: Id<"rooms">;

  name: string;
  email: string;

  role: "investigator" | "mole" | "witness";

  joinedAt: number;
  roleViewedAt?: number;
  votedAt?: number;
  verdictSharedAt?: number;

  userAgent?: string;
}
```

---

### `votes`

Stores each player vote.

```ts
{
  roomId: Id<"rooms">;
  playerId: Id<"players">;
  suspectId: "cto" | "intern" | "senior_dev";
  createdAt: number;
}
```

---

### `events`

Stores all important actions for proof.

```ts
{
  roomId?: Id<"rooms">;
  playerId?: Id<"players">;
  type: string;
  payload?: any;
  createdAt: number;
}
```

---

### `interrogations`

Stores each suspect question asked.

```ts
{
  roomId: Id<"rooms">;
  playerId?: Id<"players">;

  suspectId: "cto" | "intern" | "senior_dev";
  questionId: string;

  answerText: string;
  audioUrl?: string;

  createdAt: number;
}
```

---

### `verdictCards`

Stores shareable verdict card metadata.

```ts
{
  roomId: Id<"rooms">;
  playerId?: Id<"players">;

  title: string;
  shareText: string;
  imageUrl?: string;

  createdAt: number;
}
```

---

## Routes

```text
/                                      Landing page
/join/:roomCode                        Player join page
/room/:roomCode/stage                  Host/stage screen
/room/:roomCode/player/:playerId       Player private screen
```

---

## Directory Structure

Recommended structure:

```text
midnight-deploy/
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── public/
│   ├── audio/
│   │   ├── cto-where.mp3
│   │   ├── intern-where.mp3
│   │   └── senior-where.mp3
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── Landing.tsx
│   │   ├── JoinRoom.tsx
│   │   ├── PlayerRoom.tsx
│   │   └── StageRoom.tsx
│   ├── components/
│   │   ├── QRJoinCard.tsx
│   │   ├── PlayerLobbyList.tsx
│   │   ├── RoleCard.tsx
│   │   ├── CrimeBoard.tsx
│   │   ├── SuspectCard.tsx
│   │   ├── ClueDeck.tsx
│   │   ├── InterrogationPanel.tsx
│   │   ├── VotePanel.tsx
│   │   ├── RevealSequence.tsx
│   │   └── VerdictCard.tsx
│   ├── content/
│   │   ├── case.ts
│   │   └── copy.ts
│   ├── lib/
│   │   ├── analytics.ts
│   │   ├── roomCode.ts
│   │   ├── time.ts
│   │   └── share.ts
│   └── styles.css
└── convex/
    ├── schema.ts
    ├── rooms.ts
    ├── players.ts
    ├── votes.ts
    ├── events.ts
    ├── interrogations.ts
    └── case.ts
```

---

## Local Setup

### 1. Clone or enter project

```bash
cd growthx-hermes-buildathon
```

### 2. Create Vite app

```bash
npm create vite@latest midnight-deploy -- --template react-ts
cd midnight-deploy
```

### 3. Install dependencies

```bash
npm install
npm install convex react-router-dom qrcode.react clsx lucide-react html-to-image
npm install -D tailwindcss postcss autoprefixer
```

### 4. Initialize Tailwind

```bash
npx tailwindcss init -p
```

### 5. Initialize Convex

```bash
npx convex dev
```

### 6. Start frontend dev server

```bash
npm run dev
```

---

## Environment Variables

Create a `.env.local` file if needed.

```env
# Convex
VITE_CONVEX_URL=

# Optional analytics
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=

# Optional ElevenLabs
ELEVENLABS_API_KEY=
```

For the MVP, ElevenLabs can be handled with pre-generated files in:

```text
public/audio/
```

That avoids live API latency during the demo.

---

## Development Commands

### Run frontend

```bash
npm run dev
```

### Run Convex backend

```bash
npx convex dev
```

### Build production app

```bash
npm run build
```

### Preview production build locally

```bash
npm run preview
```

### Deploy Convex

```bash
npx convex deploy
```

---

## Frontend Implementation Workflow

Build frontend in this order:

### 1. Routing

Create:

```text
/
 /join/:roomCode
 /room/:roomCode/stage
 /room/:roomCode/player/:playerId
```

### 2. Landing page

Implement:

- headline
- create room button
- join room input
- simple game explanation

### 3. Stage lobby

Implement:

- room code display
- QR code
- join link
- player list
- start game button

### 4. Player join

Implement:

- name field
- email field
- join button
- redirect to private player screen

### 5. Role card

Implement:

- Investigator view
- Mole view
- Witness view
- private objective text

### 6. Crime board

Implement:

- suspects
- case intro
- active clue
- latest interrogation answer
- current game phase

### 7. Interrogation controls

Implement:

- choose suspect
- choose preset question
- submit question
- show answer on stage
- play audio if available

### 8. Voting

Implement:

- suspect vote buttons
- one vote per player
- vote confirmation
- stage vote bars

### 9. Reveal

Implement cinematic order:

```text
You accused...
The real culprit was...
The Mole was...
Investigators win / Mole wins
```

### 10. Verdict card

Implement:

- result summary
- share text
- image download
- Web Share API if supported

---

## Backend Implementation Workflow

Build backend in this order:

### 1. Schema

Create tables:

- rooms
- players
- votes
- events
- interrogations
- verdictCards

### 2. Room creation

Implement:

```ts
createRoom()
getRoomByCode()
```

Room creation should:

- create unique room code
- set phase to `LOBBY`
- initialize timestamps
- track `room_created` event

### 3. Player joining

Implement:

```ts
joinRoom()
listPlayers()
getPlayer()
```

Player joining should:

- require name and email
- normalize email
- deduplicate player by room + email
- create `player_joined` event

### 4. Starting game

Implement:

```ts
startRoom()
```

Starting game should:

- require minimum 4 players
- randomly choose killer suspect
- randomly choose Mole
- randomly choose Witness if enough players
- assign all other players as Investigators
- move phase to `ROLES_ASSIGNED` or `CASE_INTRO`
- create `game_started` event

### 5. Clue reveal

Implement:

```ts
revealNextClue()
```

Clue reveal should:

- increment `currentClueIndex`
- create `clue_revealed` event

For MVP, use manual host reveal instead of automatic scheduler.

### 6. Interrogation

Implement:

```ts
askQuestion()
getLatestInterrogation()
```

Interrogation should:

- validate suspect
- validate question
- fetch preset answer
- store interrogation record
- create `interrogation_asked` event

### 7. Voting

Implement:

```ts
castVote()
getVotes()
getVoteSummary()
```

Voting should:

- allow one vote per player
- update existing vote if needed, or lock first vote
- store vote timestamp
- create `vote_cast` event

### 8. Reveal calculation

Implement:

```ts
getReveal()
```

Reveal should calculate:

- accused suspect
- real culprit
- Mole player
- whether investigators won
- whether Mole won

### 9. Verdict card tracking

Implement:

```ts
createVerdictCard()
markVerdictShared()
```

This should:

- store card metadata
- mark player `verdictSharedAt`
- create `verdict_shared` event

---

## Case Content

Use one case for MVP.

### Case intro

```text
At 2:13 AM, production went down.
At 2:17 AM, the database was wiped.
Three people had access.
One is lying.
```

### Suspects

#### The CTO

Personality:

```text
Calm, overconfident, says “technically” too much.
```

Possible motive:

```text
Wanted to hide a bad architecture decision.
```

#### The Intern

Personality:

```text
Nervous, overshares, says “I was just following docs.”
```

Possible motive:

```text
Pushed a migration script and panicked.
```

#### The Fired Senior Dev

Personality:

```text
Bitter, sarcastic, knows too much.
```

Possible motive:

```text
Revenge after being offboarded.
```

---

### Clues

```text
Clue 1:
The deploy came from a machine named silver-macbook.

Clue 2:
The command was not typed manually. It came from a saved shell script.

Clue 3:
The script contained a comment: “temporary fix, delete after demo.”

Clue 4:
The access token belonged to someone who was officially offboarded last week.
```

---

### Witness clue

```text
You saw a Slack message at 1:58 AM:
“If they won’t respect my architecture, they can enjoy rebuilding it.”
```

---

### Mole objective

```text
Your goal is to make the group accuse the Intern.
Push the idea that “temporary fix, delete after demo” sounds like intern behavior.
Do not be obvious.
```

---

## Signup / Action Definition

For judges, a meaningful action is:

```text
A unique player who joined with name + email, received a private role, participated in the game, and cast a vote or generated a verdict card.
```

This is stronger than counting simple page visits.

Proof comes from:

- Convex `players` table
- Convex `votes` table
- Convex `events` table
- analytics dashboard
- social post links
- room timestamps

---

## Virality and Proof Tracking

Track these events:

```text
room_created
player_joined
role_viewed
game_started
clue_revealed
interrogation_asked
vote_cast
reveal_seen
verdict_generated
verdict_shared
```

Keep a proof log during the hack:

```text
- Live app URL
- Analytics dashboard
- Convex dashboard
- Number of rooms created
- Number of players joined
- Number of votes cast
- Number of verdict cards generated
- Number of verdict cards shared
- Social post links
- Reveal clips
- Hermes session receipts
```

---

## Deployment

### Build

```bash
npm run build
```

### Deploy to Cloudflare Pages

Option 1: Cloudflare dashboard

1. Connect GitHub repo.
2. Select project.
3. Build command:

```bash
npm run build
```

4. Output directory:

```text
dist
```

Option 2: Wrangler

```bash
npm install -g wrangler
wrangler pages deploy dist --project-name midnight-deploy
```

---

## MVP Scope

The MVP must include:

- landing page
- create room
- join room with name/email
- realtime lobby
- private role assignment
- stage crime board
- suspect display
- clue reveal
- player voting
- reveal sequence
- verdict card
- Convex event tracking
- deployed public URL

---

## Features to Skip Initially

Do **not** build these before the MVP works:

- free-form AI interrogation
- multiple cases
- dynamic culprit logic beyond random assignment
- native mobile app
- payments
- advanced referral system
- complex animations
- real-time voice generation dependency
- true Among Us player-killer mode

---

## Recommended Build Order

```text
1. Create Vite + React app
2. Set up Tailwind
3. Set up Convex
4. Add routes
5. Create Convex schema
6. Implement room creation
7. Implement player joining
8. Implement live lobby
9. Implement role assignment
10. Implement stage crime board
11. Implement clue reveal
12. Implement voting
13. Implement reveal logic
14. Implement verdict card
15. Add analytics/events
16. Add pre-generated audio
17. Deploy to Cloudflare
18. Run real games
19. Collect proof
20. Demo
```

---

## Demo Flow

During judging:

1. Open public app URL.
2. Click **Create Room**.
3. Show stage screen and QR code.
4. Join from phone.
5. Show private role card.
6. Start game.
7. Ask suspect question.
8. Reveal clue.
9. Vote.
10. Show dramatic reveal.
11. Show verdict card.
12. Open Convex dashboard.
13. Show player/action records.
14. Open analytics dashboard.
15. Show Hermes session receipts.

---

## Success Metrics

For hackathon scoring, success means:

- app works live
- real players join
- meaningful actions are recorded
- players vote
- verdict cards are generated/shared
- social clips/posts exist
- analytics shows visitors
- Convex shows real timestamps
- judges can verify everything live

---

## Future Improvements

After MVP:

- dynamic AI-generated suspect answers
- multiple mystery cases
- timed automatic clue drops
- richer sound design
- generated suspect portraits
- referral tracking
- public room gallery
- leaderboard
- shareable replay page
- more roles
- true player-killer Among Us mode
- paid party packs

---

## One-Line Pitch

```text
The Midnight Deploy is a Jackbox-style murder mystery for builders: someone wiped prod at 2 AM, three AI suspects are lying, and one friend is secretly the Mole trying to frame the wrong person.
```

---

## License

Built for the GrowthX Hermes Buildathon.