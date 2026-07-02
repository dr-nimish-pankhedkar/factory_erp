-- Managers/Admins can now initiate a task by typing instead of only
-- recording a voice note (Staff-facing screens remain audio/icon-only).
alter type public.task_event_type add value if not exists 'text_note';
alter table public.task_events add column if not exists content text;
