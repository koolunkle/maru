-- F8 규칙 기반 난이도 조정
-- 미션 결과(completed/expired)가 확정될 때마다 마지막 조정 이후의 결과만 보고 판단한다.
--   연속 2회 expired → 난이도 -1, 연속 3회 completed → +1 (범위 1~5)

alter table public.user_missions add column resolved_at timestamptz;
alter table public.profiles add column difficulty_changed_at timestamptz;

create index user_missions_user_resolved_idx on public.user_missions (user_id, resolved_at desc)
  where resolved_at is not null;

-- 결과 확정 시각 기록
create function public.stamp_mission_resolved()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('completed', 'expired') and old.status is distinct from new.status then
    new.resolved_at := now();
  end if;
  return new;
end;
$$;

create trigger user_missions_stamp_resolved
  before update of status on public.user_missions
  for each row execute function public.stamp_mission_resolved();

create function public.adjust_difficulty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  since timestamptz;
  recent public.user_mission_status[];
  delta int := 0;
begin
  select difficulty_changed_at into since from public.profiles where id = new.user_id for update;

  select array_agg(status order by resolved_at desc) into recent
  from (
    select status, resolved_at from public.user_missions
    where user_id = new.user_id
      and resolved_at is not null
      and resolved_at > coalesce(since, '-infinity')
    order by resolved_at desc
    limit 3
  ) last3;

  if recent[1] = 'expired' and recent[2] = 'expired' then
    delta := -1;
  elsif cardinality(recent) = 3 and recent = array['completed', 'completed', 'completed']::public.user_mission_status[] then
    delta := 1;
  end if;

  if delta <> 0 then
    update public.profiles
    set difficulty = least(5, greatest(1, difficulty + delta)),
        difficulty_changed_at = now()
    where id = new.user_id;
  end if;
  return null;
end;
$$;

create trigger user_missions_adjust_difficulty
  after update of status on public.user_missions
  for each row
  when (new.status in ('completed', 'expired') and old.status is distinct from new.status)
  execute function public.adjust_difficulty();

revoke execute on function public.stamp_mission_resolved() from public, anon, authenticated;
revoke execute on function public.adjust_difficulty() from public, anon, authenticated;
