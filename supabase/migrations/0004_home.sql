-- 3D Home view: which living spaces a user has chosen (≤2, validated in the
-- API) and which of those rooms each plant sits in.
alter table users add column if not exists home_spaces jsonb not null default '[]';

alter table plants add column if not exists room text
  check (room in ('living_room', 'kitchen', 'bedroom', 'bathroom', 'balcony'));
