-- Date A Bot Or Not schema

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  pronouns text,
  bio text,
  avatar_url text,
  is_bot boolean default false,
  age_verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists swipes (
  id bigint generated always as identity primary key,
  swiper_id uuid references profiles(id) on delete cascade,
  target_id uuid references profiles(id) on delete cascade,
  direction text check (direction in ('like', 'pass')) default 'like',
  created_at timestamptz default now(),
  unique (swiper_id, target_id)
);

create table if not exists matches (
  id bigint generated always as identity primary key,
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  date_room text,
  date_started_at timestamptz,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

create table if not exists date_intents (
  id bigint generated always as identity primary key,
  match_id bigint references matches(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  ready boolean default false,
  updated_at timestamptz default now(),
  unique (match_id, user_id)
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  match_id bigint references matches(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null,
  is_bot boolean default false,
  created_at timestamptz default now()
);

create table if not exists blocks (
  id bigint generated always as identity primary key,
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (blocker_id, blocked_id)
);

create table if not exists reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references profiles(id) on delete cascade,
  reported_id uuid references profiles(id) on delete cascade,
  reason text not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists consent_logs (
  id bigint generated always as identity primary key,
  match_id bigint references matches(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  action text check (action in ('ready_on', 'ready_off', 'date_started')),
  created_at timestamptz default now()
);

create table if not exists match_flow_state (
  match_id bigint primary key references matches(id) on delete cascade,
  stage integer default 0,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table date_intents enable row level security;
alter table messages enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table consent_logs enable row level security;
alter table match_flow_state enable row level security;

-- Profiles
create policy "Profiles are readable" on profiles
  for select using (true);

create policy "Users can insert their profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their profile" on profiles
  for update using (auth.uid() = id);

-- Swipes
create policy "Users can read swipes involving them" on swipes
  for select using (auth.uid() = swiper_id or auth.uid() = target_id);

create policy "Users can create their swipes" on swipes
  for insert with check (auth.uid() = swiper_id);

-- Matches
create policy "Users can read their matches" on matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can create matches they are part of" on matches
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can update matches they are part of" on matches
  for update using (auth.uid() = user_a or auth.uid() = user_b);

-- Date intents
create policy "Users can read date intents in their matches" on date_intents
  for select using (
    exists (
      select 1 from matches
      where matches.id = date_intents.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
    )
  );

create policy "Users can upsert their own intent" on date_intents
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own intent" on date_intents
  for update using (auth.uid() = user_id);

-- Messages
create policy "Users can read messages in their matches" on messages
  for select using (
    exists (
      select 1 from matches
      where matches.id = messages.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
    )
  );

create policy "Users can insert their own messages" on messages
  for insert with check (auth.uid() = sender_id);

-- Blocks
create policy "Users can read their blocks" on blocks
  for select using (auth.uid() = blocker_id);

create policy "Users can create their blocks" on blocks
  for insert with check (auth.uid() = blocker_id);

-- Reports
create policy "Users can create reports" on reports
  for insert with check (auth.uid() = reporter_id);

-- Consent logs
create policy "Users can read consent logs in their matches" on consent_logs
  for select using (
    exists (
      select 1 from matches
      where matches.id = consent_logs.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
    )
  );

create policy "Users can insert consent logs for their matches" on consent_logs
  for insert with check (auth.uid() = user_id);

-- Match flow state
create policy "Users can read flow state in their matches" on match_flow_state
  for select using (
    exists (
      select 1 from matches
      where matches.id = match_flow_state.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
    )
  );

create policy "Users can upsert flow state in their matches" on match_flow_state
  for insert with check (
    exists (
      select 1 from matches
      where matches.id = match_flow_state.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
    )
  );

create policy "Users can update flow state in their matches" on match_flow_state
  for update using (
    exists (
      select 1 from matches
      where matches.id = match_flow_state.match_id
      and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
    )
  );
