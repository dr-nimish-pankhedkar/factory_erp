-- Removes the "log processing" feature (raw material -> finished material
-- conversion log). Not used by this operation's workflow.
drop view if exists public.material_stock;

drop table if exists public.processing_log;

create view public.material_stock as
select
  m.id as material_id,
  m.name,
  m.default_unit,
  m.category,
  coalesce(intake.total, 0)
    - coalesce(dispatched.total, 0)
    + coalesce(moves_in.total, 0)
    - coalesce(moves_out.total, 0) as current_stock
from public.materials m
left join (
  select material_id, sum(quantity) as total
  from public.material_intake group by material_id
) intake on intake.material_id = m.id
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
