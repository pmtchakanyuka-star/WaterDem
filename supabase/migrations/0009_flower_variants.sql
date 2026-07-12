-- Four house-flower avatar looks: daisies ("flower"), peace lily, orchid,
-- African violet.
alter table plants drop constraint if exists plants_plant_look_check;
alter table plants add constraint plants_plant_look_check
  check (plant_look in ('monstera', 'fern', 'palm', 'banana', 'cannabis',
                        'flower', 'lily', 'orchid', 'violet'));
