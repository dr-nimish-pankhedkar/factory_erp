-- Single private bucket, path-prefixed by feature:
--   avatars/{profile_id}/...
--   tasks/{task_assignee_id}/...        (matches task_events thread scope)
--   requests/{request_id}/...
--   gate-passes/{gate_pass_id}/...
--   intake/{intake_id}/...
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy "media_select" on storage.objects
  for select using (
    bucket_id = 'media' and (
      public.is_admin()
      or (storage.foldername(name))[1] = 'avatars'
      or (
        (storage.foldername(name))[1] = 'tasks'
        and exists (
          select 1 from public.task_assignees ta
          join public.tasks t on t.id = ta.task_id
          where ta.id::text = (storage.foldername(name))[2]
            and (ta.staff_id = auth.uid() or t.created_by = auth.uid())
        )
      )
      or (
        (storage.foldername(name))[1] = 'requests'
        and exists (
          select 1 from public.requests r
          where r.id::text = (storage.foldername(name))[2]
            and (r.staff_id = auth.uid() or r.manager_id = auth.uid() or (r.manager_id is null and public.is_manager_or_admin()))
        )
      )
      or (
        (storage.foldername(name))[1] in ('gate-passes', 'intake')
        and public.is_manager_or_admin()
      )
    )
  );

create policy "media_insert" on storage.objects
  for insert with check (
    bucket_id = 'media' and auth.uid() is not null and (
      public.is_manager_or_admin() -- covers avatars, gate-passes, intake uploads
      or (
        (storage.foldername(name))[1] = 'tasks'
        and exists (
          select 1 from public.task_assignees ta
          join public.tasks t on t.id = ta.task_id
          where ta.id::text = (storage.foldername(name))[2]
            and (ta.staff_id = auth.uid() or t.created_by = auth.uid())
        )
      )
      or (
        (storage.foldername(name))[1] = 'requests'
        and exists (
          select 1 from public.requests r
          where r.id::text = (storage.foldername(name))[2]
            and (r.staff_id = auth.uid() or r.manager_id = auth.uid() or (r.manager_id is null and public.is_manager_or_admin()))
        )
      )
    )
  );
