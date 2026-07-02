-- Generalizes "materials" into an Admin-managed item catalog covering raw
-- materials, packaging consumables, and machine parts (belts etc., tracked
-- as simple stock counts, not individually-serialized assets).
create type public.material_category as enum ('raw_material', 'consumable', 'machine_part');

alter table public.materials add column if not exists category public.material_category not null default 'raw_material';
alter table public.materials add column if not exists is_active boolean not null default true;
alter table public.materials add column if not exists created_by uuid references public.profiles(id);

-- Stock movements for consumables/machine parts: simple in/out log, distinct
-- from the intake -> processing -> dispatch flow used for raw materials.
create table public.consumable_stock_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id),
  direction text not null check (direction in ('in', 'out')),
  quantity numeric not null check (quantity > 0),
  reason text,
  recorded_by uuid not null references public.profiles(id),
  recorded_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index on public.consumable_stock_movements (material_id);

alter table public.consumable_stock_movements enable row level security;
create policy "consumable_movements_select" on public.consumable_stock_movements
  for select using (public.is_manager_or_admin());
create policy "consumable_movements_insert" on public.consumable_stock_movements
  for insert with check (public.is_manager_or_admin() and recorded_by = auth.uid());

-- material_stock now folds in consumable movements too. Raw materials have
-- zero rows in consumable_stock_movements (and vice versa), so one formula
-- covers every category without branching.
drop view if exists public.material_stock;
create view public.material_stock as
select
  m.id as material_id,
  m.name,
  m.default_unit,
  m.category,
  coalesce(intake.total, 0)
    + coalesce(proc_out.total, 0)
    - coalesce(proc_in.total, 0)
    - coalesce(dispatched.total, 0)
    + coalesce(moves_in.total, 0)
    - coalesce(moves_out.total, 0) as current_stock
from public.materials m
left join (
  select material_id, sum(quantity) as total
  from public.material_intake group by material_id
) intake on intake.material_id = m.id
left join (
  select output_material_id as material_id, sum(output_quantity) as total
  from public.processing_log group by output_material_id
) proc_out on proc_out.material_id = m.id
left join (
  select input_material_id as material_id, sum(input_quantity) as total
  from public.processing_log group by input_material_id
) proc_in on proc_in.material_id = m.id
left join (
  select material_id, sum(quantity) as total
  from public.gate_passes where material_id is not null group by material_id
) dispatched on dispatched.material_id = m.id
left join (
  select material_id, sum(quantity) as total
  from public.consumable_stock_movements where direction = 'in' group by material_id
) moves_in on moves_in.material_id = m.id
left join (
  select material_id, sum(quantity) as total
  from public.consumable_stock_movements where direction = 'out' group by material_id
) moves_out on moves_out.material_id = m.id;

-- Catalog management is Admin-only (Managers can still select items in
-- dropdowns via the existing select-all policy, just can't create/edit).
drop policy if exists "materials_insert_staff_mgmt" on public.materials;
drop policy if exists "materials_update_staff_mgmt" on public.materials;
create policy "materials_insert_admin" on public.materials
  for insert with check (public.is_admin());
create policy "materials_update_admin" on public.materials
  for update using (public.is_admin());
