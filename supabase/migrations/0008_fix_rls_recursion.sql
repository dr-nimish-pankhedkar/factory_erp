-- tasks_select and task_assignees_select each subquery the other table,
-- which Postgres detects as circular RLS evaluation ("infinite recursion
-- detected in policy for relation") once both tables are touched in the
-- same statement (e.g. inserting a task_assignee and selecting it back).
-- Fix: security-definer helpers bypass RLS internally, breaking the cycle.
create or replace function public.is_task_creator(p_task_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.tasks t where t.id = p_task_id and t.created_by = auth.uid());
$$;

create or replace function public.is_task_assignee(p_task_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.task_assignees ta where ta.task_id = p_task_id and ta.staff_id = auth.uid());
$$;

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (
    public.is_admin()
    or created_by = auth.uid()
    or public.is_task_assignee(id)
  );

drop policy if exists "task_assignees_select" on public.task_assignees;
create policy "task_assignees_select" on public.task_assignees
  for select using (
    public.is_admin()
    or staff_id = auth.uid()
    or public.is_task_creator(task_id)
  );

drop policy if exists "task_assignees_insert" on public.task_assignees;
create policy "task_assignees_insert" on public.task_assignees
  for insert with check (
    public.is_admin() or public.is_task_creator(task_id)
  );

drop policy if exists "task_assignees_update" on public.task_assignees;
create policy "task_assignees_update" on public.task_assignees
  for update using (
    public.is_admin() or staff_id = auth.uid() or public.is_task_creator(task_id)
  );

drop policy if exists "task_assignees_delete" on public.task_assignees;
create policy "task_assignees_delete" on public.task_assignees
  for delete using (
    public.is_admin() or public.is_task_creator(task_id)
  );
