-- AI health checkups: photo/description in, diagnosis + advice out. History
-- shows in the plant detail sheet. Owner-only (more sensitive than water logs).
create table health_checks (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  image_url text,
  note text,
  severity text not null check (severity in ('ok','watch','act')),
  summary text not null,
  diagnosis text not null,
  advice jsonb not null default '[]',
  suggested_stage text check (suggested_stage in ('seed','seedling','young','mature')),
  created_at timestamptz not null default now()
);
create index health_checks_plant_id_idx on health_checks (plant_id, created_at desc);
alter table health_checks enable row level security;
alter table health_checks force row level security;
create policy health_checks_select on health_checks for select using (
  exists (select 1 from plants p where p.id = health_checks.plant_id
    and p.owner_id = (select current_app_user())));
create policy health_checks_insert on health_checks for insert with check (
  exists (select 1 from plants p where p.id = health_checks.plant_id
    and p.owner_id = (select current_app_user())));
create policy health_checks_delete on health_checks for delete using (
  exists (select 1 from plants p where p.id = health_checks.plant_id
    and p.owner_id = (select current_app_user())));
