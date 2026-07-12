-- Life stage of the plant; drives stage-aware AI care plans and 3D scale.
-- Default 'mature' so existing plants are unaffected.
alter table plants add column if not exists growth_stage text not null default 'mature'
  check (growth_stage in ('seed','seedling','young','mature'));
