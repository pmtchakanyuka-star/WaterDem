-- Pet safety for each plant — surfaced from research (ASPCA toxicity data).
-- The AI botanist fills these at identification; shown as a badge in the UI so
-- owners with cats/dogs know what's on the shelf.
--   'toxic' — meaningful harm if chewed (calcium oxalate, saponins, etc.)
--   'mild'  — usually minor/short-lived GI or skin irritation
--   'safe'  — ASPCA-listed non-toxic to cats and dogs
--   null    — unknown / not assessed
alter table plants add column if not exists pet_safety text
  check (pet_safety in ('toxic', 'mild', 'safe'));
alter table plants add column if not exists pet_safety_note text;
