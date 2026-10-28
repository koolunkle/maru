create function public.check_mission_start() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 3));
  if exists (select 1 from public.user_missions where user_id = new.user_id and mission_id = new.mission_id and status in ('in_progress', 'judging')) then
    raise exception 'mission_already_active';
  end if;
  if (select count(*) from public.user_missions where user_id = new.user_id and type = new.type and status in ('in_progress', 'judging')) >=
    (case when new.type = 'daily' then 3 else 1 end) then raise exception 'mission_limit'; end if;
  return new;
end;
$$;
create trigger user_missions_check_start before insert on public.user_missions for each row execute function public.check_mission_start();
revoke all on function public.check_mission_start() from public, anon, authenticated;

create function public.start_mission(p_user_id uuid, p_mission_id uuid, p_type public.mission_type, p_due_at timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if p_user_id is null or p_mission_id is null or p_type is null or p_due_at is null then raise exception 'invalid_mission'; end if;
  if not exists (select 1 from public.missions where id = p_mission_id and (source <> 'ai' or created_for = p_user_id)) then
    raise exception 'invalid_mission';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 3));
  select id into result from public.user_missions where user_id = p_user_id and mission_id = p_mission_id
    and status <> 'expired' order by started_at desc limit 1;
  if found then return result; end if;
  insert into public.user_missions(user_id, mission_id, type, due_at) values (p_user_id, p_mission_id, p_type, p_due_at) returning id into result;
  return result;
end;
$$;
revoke all on function public.start_mission(uuid, uuid, public.mission_type, timestamptz) from public, anon, authenticated;
grant execute on function public.start_mission(uuid, uuid, public.mission_type, timestamptz) to service_role;
