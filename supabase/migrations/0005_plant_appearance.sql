-- Home-view "avatar" for each plant: the user can pick a plant look and a pot
-- look independent of the identified species. NULL = auto (derive from species,
-- with cannabis-named plants getting the cannabis look + Rasta pot).
alter table plants add column if not exists plant_look text
  check (plant_look in ('monstera', 'fern', 'palm', 'banana', 'cannabis'));

alter table plants add column if not exists pot_look text
  check (pot_look in ('twotone', 'terracotta', 'teal', 'rasta', 'sand'));
