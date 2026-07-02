-- Task photos (e.g. photo of the machine part) are set once by the
-- assigner and are task-level, not per-assignee-thread like task_events
-- audio. Separate prefix + policy: task-photos/{task_id}/...
create policy "media_select_task_photos" on storage.objects
  for select using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'task-photos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.tasks t
        where t.id::text = (storage.foldername(name))[2]
          and (
            t.created_by = auth.uid()
            or exists (select 1 from public.task_assignees ta where ta.task_id = t.id and ta.staff_id = auth.uid())
          )
      )
    )
  );

create policy "media_insert_task_photos" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'task-photos'
    and exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2] and t.created_by = auth.uid()
    )
  );
