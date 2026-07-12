# Inside Out — setup & run

A Jackbox-style browser murder mystery. React + Vite + Tailwind on the front,
**Supabase** (Postgres + realtime) as the backend, deployed on **Cloudflare Pages**,
suspect voices by **ElevenLabs**.

> Note: the long design doc in `README.md` mentions Convex — the implementation
> uses **Supabase** instead. This file is the source of truth for running it.

---

## 1. Install

```bash
pnpm install
```

## 2. Supabase (backend)

1. Create a free project at https://supabase.com.
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   (Creates tables, enables realtime, sets permissive hackathon RLS.)
3. **Project Settings → API**: copy the Project URL and the `anon` public key.
4. Create `.env.local`:

```bash
cp .env.example .env.local
# then fill in:
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Run it

```bash
pnpm dev
```

- Open the app on a **laptop** → **Create Game** → this is the **stage** (the shared screen).
- Scan the QR / open the room link on **phones** → each player enters name + email,
  gets a secret role, interrogates, and votes.
- Drive the game from the stage: BEGIN THE CASE → START INVESTIGATION → reveal clues →
  CALL THE VOTE → REVEAL THE TRUTH.

Minimum 3 players to start (the pitch targets 4–8).

---

## How to play

**The premise:** someone wiped the production database at 2 AM. Three colleagues had
access — the **CTO**, the **Intern**, and the **Fired Senior Dev**. One of them did it.
Your group has to figure out who.

**Two screens:**
- **The stage** (laptop / shared screen) — the crime board, clues, timer, and the reveal.
- **Your phone** — your private secret role and your actions.

**Secret roles (dealt privately to each phone):**
- 🕵️ **Investigator** — most players. Catch the real culprit.
- 🎭 **Mole** — exactly one player. You secretly know who really did it — your job is to
  make the group accuse **someone else**. Blend in.
- 👁️ **Witness** — one player (5+ games). You got one true clue. Use it wisely.

**The flow:**
1. **Lobby** — host creates a game; players scan the QR and join with name + email.
2. **Roles** — each phone reveals its secret role (tap the card to flip it).
3. **The case** — the stage lays out the crime and the three suspects.
4. **Investigation** — from your phone, pick a suspect and ask them a question; they
   **answer out loud** (their voice plays on the stage). The host reveals a new clue every
   round. Argue it out in the room — this is the heart of the game.
5. **The vote** — everyone accuses one suspect. The Mole tries to swing it the wrong way.
6. **The reveal** — the stage dramatically shows who you accused, the **real culprit**, and
   **unmasks the Mole**.

**Who wins:**
- **Investigators win** if the group votes the real culprit.
- **The Mole wins** if the group accuses the wrong suspect.

**After:** each player gets a shareable **verdict card** and a link to start their own game.

## 4. Suspect sprites (optional but recommended)

Drop three transparent PNGs into `public/sprites/`:

```
suspect-cto.png
suspect-intern.png
suspect-senior_dev.png
```

Prompts are in `~/inside-out-sprite-prompts.md`. Until they exist, suspects show
styled emoji placeholders — no code change needed.

## 5. Suspect voices — ElevenLabs (power-up)

```bash
ELEVENLABS_API_KEY=sk_xxx pnpm gen:audio
```

Generates 24 `.mp3` files into `public/audio/` with the exact names the app plays.
Optionally cast better voices with `VOICE_CTO`, `VOICE_INTERN`, `VOICE_SENIOR_DEV`
(ElevenLabs voice IDs).

## 6. Deploy — Cloudflare Pages (power-up)

Option A — dashboard:
1. Push this repo to GitHub.
2. Cloudflare → Pages → Connect to Git → pick the repo.
3. Build command `pnpm build`, output directory `dist`.
4. Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy. (SPA routing is handled by `public/_redirects`.)

Option B — Wrangler:
```bash
pnpm build
npx wrangler pages deploy dist --project-name inside-out
```

Enable **Cloudflare Web Analytics** on the Pages project for the Visitors metric
(no code needed) — or add Plausible/PostHog.

---

## 7. Proof for judges (Virality)

Every meaningful action is written to Supabase, verifiable live:

| Signal | Where to show it |
|---|---|
| Signups (25x) | `players` table — each row = a real player (name + email) |
| Actions | `events` table — `player_joined`, `role_viewed`, `vote_cast`, `verdict_shared` |
| Games hosted | `rooms` table |
| Referral loop | `rooms.parent_room_code` / `spawned_rooms_count` |
| Visitors | Cloudflare Web Analytics (give mentors read-only access) |
| Reach | your launch posts + shared verdict cards |

Keep a running proof log: live URL, Supabase dashboard, analytics dashboard,
number of rooms/players/votes/verdict-shares, social post links, reveal clips,
and your Hermes session receipts.
