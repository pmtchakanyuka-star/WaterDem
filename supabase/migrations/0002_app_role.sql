-- Dedicated application role, subject to RLS.
--
-- Supabase's `postgres` role has BYPASSRLS, so the app must NOT connect as
-- postgres or the policies in 0001 would be decorative. `waterdem_app` has
-- no elevated attributes: RLS is enforced on every query it runs.
--
-- The role is created NOLOGIN; enabling login + setting the password is an
-- out-of-band setup step (never a committed migration):
--   alter role waterdem_app login password '<generated>';
-- Then DATABASE_URL connects via the pooler as
--   postgresql://waterdem_app.<project-ref>:<password>@<pooler-host>:6543/postgres

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'waterdem_app') then
    create role waterdem_app nologin nosuperuser nocreatedb nocreaterole nobypassrls;
  end if;
end
$$;

grant usage on schema public to waterdem_app;
grant select, insert, update, delete on all tables in schema public to waterdem_app;
alter default privileges in schema public
  grant select, insert, update, delete on tables to waterdem_app;
