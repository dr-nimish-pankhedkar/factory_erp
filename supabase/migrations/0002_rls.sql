-- Helper functions (security definer: bypass RLS internally to avoid
-- recursive policy checks when reading the caller's own role).
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.is_manager_or_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','manager') and is_active);
$$;

create or replace function public.current_role_is_staff()
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'staff' and is_active);
$$;

alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_events enable row level security;
alter table public.requests enable row level security;
alter table public.request_events enable row level security;
alter table public.gate_passes enable row level security;
alter table public.material_intake enable row level security;
alter table public.processing_log enable row level security;

-- profiles: broad read (small trusted team, needed for name/photo lists).
-- All writes (create account, change role, deactivate, reset PIN) go
-- through server actions using the service-role client, which bypasses
-- RLS entirely — so there are deliberately no insert/update policies here
-- for the `authenticated` role.
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- materials: readable by anyone signed in; managed by manager/admin
create policy "materials_select_all" on public.materials
  for select using (true);
create policy "materials_insert_staff_mgmt" on public.materials
  for insert with check (public.is_manager_or_admin());
create policy "materials_update_staff_mgmt" on public.materials
  for update using (public.is_manager_or_admin());

-- tasks
create policy "tasks_select" on public.tasks
  for select using (
    public.is_admin()
    or created_by = auth.uid()
    or exists (select 1 from public.task_assignees ta where ta.task_id = id and ta.staff_id = auth.uid())
  );
create policy "tasks_insert" on public.tasks
  for insert with check (public.is_manager_or_admin() and created_by = auth.uid());
create policy "tasks_update" on public.tasks
  for update using (public.is_admin() or created_by = auth.uid());

-- task_assignees
create policy "task_assignees_select" on public.task_assignees
  for select using (
    public.is_admin()
    or staff_id = auth.uid()
    or exists (select 1 from public.tasks t where t.id = task_id and t.created_by = auth.uid())
  );
create policy "task_assignees_insert" on public.task_assignees
  for insert with check (
    public.is_admin()
    or exists (select 1 from public.tasks t where t.id = task_id and t.created_by = auth.uid())
  );
create policy "task_assignees_update" on public.task_assignees
  for update using (
    public.is_admin()
    or staff_id = auth.uid()
    or exists (select 1 from public.tasks t where t.id = task_id and t.created_by = auth.uid())
  );
create policy "task_assignees_delete" on public.task_assignees
  for delete using (
    public.is_admin()
    or exists (select 1 from public.tasks t where t.id = task_id and t.created_by = auth.uid())
  );

-- task_events: private per (task, assignee) thread — only that staff
-- member, the assigner, and Admin can see or post into it.
create policy "task_events_select" on public.task_events
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.task_assignees ta
      join public.tasks t on t.id = ta.task_id
      where ta.id = task_assignee_id
        and (ta.staff_id = auth.uid() or t.created_by = auth.uid())
    )
  );
create policy "task_events_insert" on public.task_events
  for insert with check (
    author_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.task_assignees ta
        join public.tasks t on t.id = ta.task_id
        where ta.id = task_assignee_id
          and (ta.staff_id = auth.uid() or t.created_by = auth.uid())
      )
    )
  );

-- requests
create policy "requests_select" on public.requests
  for select using (
    public.is_admin()
    or staff_id = auth.uid()
    or manager_id = auth.uid()
    or (manager_id is null and public.is_manager_or_admin())
  );
create policy "requests_insert" on public.requests
  for insert with check (staff_id = auth.uid() and public.current_role_is_staff());
create policy "requests_update" on public.requests
  for update using (
    public.is_admin()
    or manager_id = auth.uid()
    or (manager_id is null and public.is_manager_or_admin())
  );

create policy "request_events_select" on public.request_events
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.requests r
      where r.id = request_id
        and (r.staff_id = auth.uid() or r.manager_id = auth.uid() or (r.manager_id is null and public.is_manager_or_admin()))
    )
  );
create policy "request_events_insert" on public.request_events
  for insert with check (
    author_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.requests r
        where r.id = request_id
          and (r.staff_id = auth.uid() or r.manager_id = auth.uid() or (r.manager_id is null and public.is_manager_or_admin()))
      )
    )
  );

-- gate_passes: Manager/Admin only (no Staff visibility per spec)
create policy "gate_passes_select" on public.gate_passes
  for select using (public.is_manager_or_admin());
create policy "gate_passes_insert" on public.gate_passes
  for insert with check (public.is_manager_or_admin() and raised_by = auth.uid());

-- material_intake: Manager/Admin only
create policy "material_intake_select" on public.material_intake
  for select using (public.is_manager_or_admin());
create policy "material_intake_insert" on public.material_intake
  for insert with check (public.is_manager_or_admin() and entered_by = auth.uid());

-- processing_log: Manager/Admin only
create policy "processing_log_select" on public.processing_log
  for select using (public.is_manager_or_admin());
create policy "processing_log_insert" on public.processing_log
  for insert with check (public.is_manager_or_admin() and processed_by = auth.uid());

-- material_stock is a plain view with no RLS of its own: it inherits
-- restrictions from material_intake/processing_log/gate_passes, so a
-- Staff caller (blocked from all three) sees zero/partial aggregates,
-- not an error. Fine for v1 — the stock dashboard is Admin/Manager-only
-- in the UI anyway.
