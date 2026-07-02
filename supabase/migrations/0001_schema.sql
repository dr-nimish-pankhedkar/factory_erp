-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum ('admin', 'manager', 'staff');
create type public.task_status as enum ('not_started', 'in_progress', 'done');
create type public.task_event_type as enum ('voice_note', 'status_change', 'photo');
create type public.request_category as enum ('machine_issue', 'material_shortage', 'safety', 'other');
create type public.request_status as enum ('open', 'acknowledged', 'resolved');

-- profiles: one row per auth.users row, created via admin API on account creation
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null unique,
  role public.user_role not null default 'staff',
  photo_url text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- materials: lookup table (bhagar, little millet, bhagar flour, etc.)
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_unit text not null,
  created_at timestamptz not null default now()
);

-- tasks: the voice-note assignment itself; can have multiple assignees
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  title text,
  photo_url text,
  due_date date,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- task_assignees: one row per (task, staff) pair — status tracked independently per staff
create table public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  staff_id uuid not null references public.profiles(id),
  status public.task_status not null default 'not_started',
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (task_id, staff_id)
);

-- task_events: private thread scoped to one task_assignee (assigner <-> that one staff member)
create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_assignee_id uuid not null references public.task_assignees(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  event_type public.task_event_type not null,
  audio_url text,
  photo_url text,
  status_from public.task_status,
  status_to public.task_status,
  created_at timestamptz not null default now()
);

-- requests: staff -> manager (or any manager) voice request
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id),
  manager_id uuid references public.profiles(id), -- null = unclaimed, visible to any manager
  category public.request_category not null default 'other',
  status public.request_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  audio_url text,
  status_from public.request_status,
  status_to public.request_status,
  created_at timestamptz not null default now()
);

-- gate_passes: single-step, immediately valid; Admin audits after the fact
create table public.gate_passes (
  id uuid primary key default gen_random_uuid(),
  pass_code text not null unique,
  raised_by uuid not null references public.profiles(id),
  material_id uuid references public.materials(id),
  item_description text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  vendor_or_vehicle text,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.material_intake (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id),
  quantity numeric not null check (quantity > 0),
  unit text not null,
  source_vendor text,
  entered_by uuid not null references public.profiles(id),
  photo_url text,
  received_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- processing_log: raw material consumed -> finished material produced
create table public.processing_log (
  id uuid primary key default gen_random_uuid(),
  input_material_id uuid not null references public.materials(id),
  input_quantity numeric not null check (input_quantity > 0),
  output_material_id uuid not null references public.materials(id),
  output_quantity numeric not null check (output_quantity > 0),
  processed_by uuid not null references public.profiles(id),
  processed_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

-- material_stock: intake + produced - consumed - dispatched, per material
create view public.material_stock as
select
  m.id as material_id,
  m.name,
  m.default_unit,
  coalesce(intake.total, 0)
    + coalesce(proc_out.total, 0)
    - coalesce(proc_in.total, 0)
    - coalesce(dispatched.total, 0) as current_stock
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
) dispatched on dispatched.material_id = m.id;

-- Indexes
create index on public.profiles (role);
create index on public.task_assignees (staff_id);
create index on public.task_assignees (task_id);
create index on public.task_events (task_assignee_id);
create index on public.requests (staff_id);
create index on public.requests (manager_id);
create index on public.request_events (request_id);
create index on public.gate_passes (raised_by);
create index on public.gate_passes (material_id);
create index on public.material_intake (material_id);
create index on public.processing_log (input_material_id);
create index on public.processing_log (output_material_id);
