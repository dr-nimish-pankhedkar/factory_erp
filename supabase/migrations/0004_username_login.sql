-- Switch login identifier from phone (needs Supabase phone/SMS provider) to
-- an admin-assigned username (mapped to a synthetic internal email under the
-- hood for Supabase Auth, which supports email+password with no extra setup).
-- Phone becomes optional contact info instead of the login identifier.
alter table public.profiles drop constraint if exists profiles_phone_key;
alter table public.profiles alter column phone drop not null;
alter table public.profiles add column username text unique not null;
