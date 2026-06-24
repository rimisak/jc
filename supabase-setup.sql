-- ════════════════════════════════════════════════════════════════════════════
--  "Who will come?" — database setup
--  Paste this whole file into the Supabase SQL editor and click "Run".
-- ════════════════════════════════════════════════════════════════════════════

-- Tables ---------------------------------------------------------------------
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  date_text   text,
  owner_id    uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table if not exists responses (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  choice     text not null check (choice in ('yes','no','maybe')),
  name       text,
  updated_at timestamptz not null default now()
);

-- Table privileges -----------------------------------------------------------
-- Let the browser roles touch the tables at all. (Supabase usually grants this
-- automatically, but we set it explicitly so setup never fails. The Row Level
-- Security rules below are what actually decide who can do what.)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.events    to anon, authenticated;
grant select, insert, update, delete on public.responses to anon, authenticated;

-- Row Level Security ---------------------------------------------------------
alter table events    enable row level security;
alter table responses enable row level security;

-- Events: anyone can read (the vote page needs the title);
--         only the signed-in owner can create / edit / delete.
create policy events_read   on events for select using (true);
create policy events_insert on events for insert with check (auth.uid() = owner_id);
create policy events_update on events for update using (auth.uid() = owner_id);
create policy events_delete on events for delete using (auth.uid() = owner_id);

-- Responses: the public can read (for the pie chart) and vote;
--            only a signed-in host can delete.
create policy resp_read   on responses for select using (true);
create policy resp_insert on responses for insert with check (true);
create policy resp_update on responses for update using (true);
create policy resp_delete on responses for delete using (auth.role() = 'authenticated');

-- Live updates ---------------------------------------------------------------
-- Make the responses table broadcast changes so the pie chart updates in real time.
alter publication supabase_realtime add table responses;
