-- Lets requests (and replies on them) be typed instead of only voice,
-- mirroring task_events.content added in 0007.
alter table public.request_events add column if not exists content text;
