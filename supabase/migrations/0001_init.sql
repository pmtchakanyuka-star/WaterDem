-- WaterDem initial schema + Row Level Security.
--
-- Auth is custom (nickname/password, NOT Supabase Auth). The app server
-- connects over the pooler and runs every request inside a transaction that
-- sets `app.current_user_id`. Policies read it via current_app_user().
-- FORCE ROW LEVEL SECURITY keeps the table-owner connection subject to RLS,
-- making the database the primary permission layer (brief §4).

-- USERS: nickname is the unique public handle + the invite key
create table users (
  id uuid primary key default gen_random_uuid(),
  nickname text unique not null check (char_length(nickname) between 3 and 20),
  password_hash text not null,            -- bcrypt, never plaintext
  garden_is_public boolean not null default false,
  location_lat double precision,          -- optional, for weather
  location_lon double precision,
  location_label text,                    -- e.g. "Tokyo, JP"
  created_at timestamptz not null default now()
);

-- Uniqueness is case-insensitive; display keeps original casing (brief §5).
create unique index users_nickname_lower_idx on users (lower(nickname));

-- PLANTS: each belongs to one owner
create table plants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  species text,
  common_name text,
  image_url text,
  icon_key text,                          -- lucide fallback if no photo
  water_freq_days int not null default 7 check (water_freq_days between 1 and 90),
  care_level text check (care_level in ('easy','moderate','expert')),
  light text check (light in ('low','medium','bright')),
  humidity text check (humidity in ('low','medium','high')),
  soil_check text,
  weather_note text,
  nutrients jsonb not null default '[]',
  weekly_tips jsonb not null default '[]',
  fun_facts jsonb not null default '[]',
  is_public boolean not null default false,  -- the per-plant visibility checkbox
  last_watered timestamptz,
  created_at timestamptz not null default now()
);

create index plants_owner_id_idx on plants (owner_id);

-- WATER LOGS: reset the countdown, keep history
create table water_logs (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  watered_at timestamptz not null default now()
);

create index water_logs_plant_id_idx on water_logs (plant_id, watered_at desc);

-- INVITES: owner shares their garden with a specific user by nickname
create table garden_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  viewer_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, viewer_id)
);

create index garden_shares_viewer_idx on garden_shares (viewer_id);

-- Identity helper: the app sets app.current_user_id per transaction.
-- Wrapped in (select ...) inside policies so it evaluates once per query.
create or replace function current_app_user() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

alter table users enable row level security;
alter table users force row level security;
alter table plants enable row level security;
alter table plants force row level security;
alter table water_logs enable row level security;
alter table water_logs force row level security;
alter table garden_shares enable row level security;
alter table garden_shares force row level security;

-- users: rows are readable (the app only selects id/nickname/garden_is_public
-- for other users — password_hash never leaves login/signup queries);
-- INSERT is the pre-auth signup; UPDATE only your own row.
create policy users_select on users for select using (true);
create policy users_insert on users for insert with check (true);
create policy users_update on users for update
  using (id = (select current_app_user()))
  with check (id = (select current_app_user()));

-- plants: owner sees all their own; a viewer (invited, or anyone when the
-- owner's garden is public) sees exactly the is_public rows (brief §3 MVP).
create policy plants_select on plants for select using (
  owner_id = (select current_app_user())
  or (
    is_public = true
    and (
      exists (
        select 1 from users u
        where u.id = plants.owner_id and u.garden_is_public
      )
      or exists (
        select 1 from garden_shares gs
        where gs.owner_id = plants.owner_id
          and gs.viewer_id = (select current_app_user())
      )
    )
  )
);
create policy plants_insert on plants for insert
  with check (owner_id = (select current_app_user()));
create policy plants_update on plants for update
  using (owner_id = (select current_app_user()))
  with check (owner_id = (select current_app_user()));
create policy plants_delete on plants for delete
  using (owner_id = (select current_app_user()));

-- water_logs: visible when the parent plant is visible (the subquery runs
-- under the caller's RLS context, so plants policies apply inside it);
-- writable only by the plant's owner.
create policy water_logs_select on water_logs for select using (
  exists (select 1 from plants p where p.id = water_logs.plant_id)
);
create policy water_logs_insert on water_logs for insert with check (
  exists (
    select 1 from plants p
    where p.id = water_logs.plant_id
      and p.owner_id = (select current_app_user())
  )
);
create policy water_logs_delete on water_logs for delete using (
  exists (
    select 1 from plants p
    where p.id = water_logs.plant_id
      and p.owner_id = (select current_app_user())
  )
);

-- garden_shares: the owner manages invites; a viewer can see invites
-- addressed to them (needed to list "gardens shared with me" later).
create policy garden_shares_select on garden_shares for select using (
  owner_id = (select current_app_user())
  or viewer_id = (select current_app_user())
);
create policy garden_shares_insert on garden_shares for insert
  with check (owner_id = (select current_app_user()));
create policy garden_shares_delete on garden_shares for delete
  using (owner_id = (select current_app_user()));
