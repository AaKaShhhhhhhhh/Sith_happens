-- The Midnight Deploy — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Hackathon-grade: permissive RLS (anyone with the anon key can play).

-- ---------- tables ----------
create table if not exists rooms (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,
  phase                text not null default 'LOBBY',
  killer_suspect_id    text,
  mole_player_id       uuid,
  witness_player_id    uuid,
  current_clue_index   int  not null default 0,
  created_at           timestamptz not null default now(),
  started_at           timestamptz,
  voting_started_at    timestamptz,
  revealed_at          timestamptz,
  parent_room_code     text,
  spawned_rooms_count  int  not null default 0
);

create table if not exists players (
  id                uuid primary key default gen_random_uuid(),
  room_id           uuid not null references rooms(id) on delete cascade,
  name              text not null,
  email             text not null,
  role              text,
  color_index       int  not null default 0,
  is_host           boolean not null default false,
  ready             boolean not null default false,
  joined_at         timestamptz not null default now(),
  role_viewed_at    timestamptz,
  voted_at          timestamptz,
  verdict_shared_at timestamptz,
  unique (room_id, email)
);

create table if not exists votes (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  player_id  uuid not null references players(id) on delete cascade,
  suspect_id text not null,
  created_at timestamptz not null default now(),
  unique (room_id, player_id)
);

create table if not exists interrogations (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms(id) on delete cascade,
  player_id   uuid references players(id) on delete set null,
  suspect_id  text not null,
  question_id text not null,
  answer_text text not null,
  audio_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  player_id  uuid references players(id) on delete set null,
  type       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists players_room_idx        on players(room_id);
create index if not exists votes_room_idx           on votes(room_id);
create index if not exists interrogations_room_idx  on interrogations(room_id);
create index if not exists events_room_idx          on events(room_id);

-- ---------- realtime ----------
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table interrogations;

-- ---------- RLS (permissive for the hackathon) ----------
alter table rooms          enable row level security;
alter table players        enable row level security;
alter table votes          enable row level security;
alter table interrogations enable row level security;
alter table events         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['rooms','players','votes','interrogations','events'] loop
    execute format('drop policy if exists "public all" on %I;', t);
    execute format(
      'create policy "public all" on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
