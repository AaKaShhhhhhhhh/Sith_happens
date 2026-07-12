-- The Midnight Deploy — Supabase schema
-- Supabase is used as the database; Vercel serverless functions perform writes.
-- This schema also allows anon realtime/read-write for the MVP frontend flow.

create extension if not exists pgcrypto;

create table if not exists rooms (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,
  host_name            text,
  phase                text not null default 'LOBBY',
  killer_suspect_id    text,
  mole_player_id       uuid,
  witness_player_id    uuid,
  current_clue_index   int not null default 0,
  created_at           timestamptz not null default now(),
  started_at           timestamptz,
  voting_started_at    timestamptz,
  revealed_at          timestamptz,
  completed_at         timestamptz,
  parent_room_code     text,
  spawned_rooms_count  int not null default 0
);

create table if not exists players (
  id                uuid primary key default gen_random_uuid(),
  room_id           uuid not null references rooms(id) on delete cascade,
  name              text not null,
  email             text not null,
  role              text,
  color_index       int not null default 0,
  is_host           boolean not null default false,
  ready             boolean not null default false,
  joined_at         timestamptz not null default now(),
  role_viewed_at    timestamptz,
  voted_at          timestamptz,
  verdict_shared_at timestamptz,
  user_agent        text,
  unique (room_id, email)
);

alter table rooms
  drop constraint if exists rooms_mole_player_id_fkey,
  drop constraint if exists rooms_witness_player_id_fkey;

alter table rooms
  add constraint rooms_mole_player_id_fkey foreign key (mole_player_id) references players(id) on delete set null,
  add constraint rooms_witness_player_id_fkey foreign key (witness_player_id) references players(id) on delete set null;

create table if not exists votes (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  player_id  uuid not null references players(id) on delete cascade,
  suspect_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
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

create table if not exists verdict_cards (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  player_id  uuid references players(id) on delete set null,
  title      text not null,
  share_text text not null,
  image_url  text,
  created_at timestamptz not null default now()
);

create index if not exists rooms_code_idx on rooms(code);
create index if not exists players_room_idx on players(room_id);
create index if not exists players_room_email_idx on players(room_id, email);
create index if not exists votes_room_idx on votes(room_id);
create index if not exists votes_player_idx on votes(player_id);
create index if not exists interrogations_room_idx on interrogations(room_id);
create index if not exists events_room_idx on events(room_id);
create index if not exists events_type_idx on events(type, created_at desc);
create index if not exists verdict_cards_room_idx on verdict_cards(room_id);
create index if not exists verdict_cards_player_idx on verdict_cards(player_id);

do $$
begin
  alter publication supabase_realtime add table rooms;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table players;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table votes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table interrogations;
exception when duplicate_object then null;
end $$;

alter table rooms          enable row level security;
alter table players        enable row level security;
alter table votes          enable row level security;
alter table interrogations enable row level security;
alter table events         enable row level security;
alter table verdict_cards  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['rooms','players','votes','interrogations','events','verdict_cards'] loop
    execute format('drop policy if exists "public all" on %I;', t);
    execute format(
      'create policy "public all" on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
