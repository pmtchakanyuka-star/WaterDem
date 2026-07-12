-- Add the "flower" option to the home-view plant avatar.
alter table plants drop constraint if exists plants_plant_look_check;
alter table plants add constraint plants_plant_look_check
  check (plant_look in ('monstera', 'fern', 'palm', 'banana', 'cannabis', 'flower'));
