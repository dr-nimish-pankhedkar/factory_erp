-- Supports up to a few in-app camera captures per record instead of a
-- single photo_url.
alter table public.tasks add column if not exists photo_urls text[] not null default '{}';
update public.tasks set photo_urls = array[photo_url] where photo_url is not null and photo_urls = '{}';
alter table public.tasks drop column if exists photo_url;

alter table public.material_intake add column if not exists photo_urls text[] not null default '{}';
update public.material_intake set photo_urls = array[photo_url] where photo_url is not null and photo_urls = '{}';
alter table public.material_intake drop column if exists photo_url;
