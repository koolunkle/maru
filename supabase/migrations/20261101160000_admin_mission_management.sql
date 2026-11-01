create table public.admin_login_attempts (
  key_hash text primary key,
  failures integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from public, anon, authenticated;
grant all on public.admin_login_attempts to service_role;

create function public.check_admin_attempt(p_key_hash text, p_valid boolean, p_limit integer default 5)
returns boolean language plpgsql security definer set search_path='' as $$
declare attempt public.admin_login_attempts%rowtype;
begin
  if p_key_hash is null or length(p_key_hash)<>64 or p_valid is null or p_limit not in (5,100) then raise exception 'invalid_request'; end if;
  delete from public.admin_login_attempts where window_start<now()-interval '1 day';
  insert into public.admin_login_attempts(key_hash) values(p_key_hash) on conflict do nothing;
  select * into attempt from public.admin_login_attempts where key_hash=p_key_hash for update;
  if attempt.window_start<=now()-interval '10 minutes' then
    attempt.failures:=0;
    update public.admin_login_attempts set failures=0,window_start=now() where key_hash=p_key_hash;
  end if;
  if attempt.failures>=p_limit then return false; end if;
  if not p_valid then
    update public.admin_login_attempts set failures=failures+1 where key_hash=p_key_hash;
  end if;
  return true;
end $$;

create function public.admin_delete_mission(p_mission_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform id from public.missions where id=p_mission_id and source<>'ai' for update;
  if not found then raise exception 'mission_not_found'; end if;
  if exists(select 1 from public.user_missions where mission_id=p_mission_id)
    or exists(select 1 from public.mission_participants where mission_id=p_mission_id)
    or exists(select 1 from public.relay_messages where mission_id=p_mission_id)
    or exists(select 1 from public.mission_photos where mission_id=p_mission_id) then
    raise exception 'mission_has_records';
  end if;
  delete from public.missions where id=p_mission_id;
end $$;

create function public.admin_attach_photo(p_mission_id uuid,p_storage_path text,p_hint text)
returns bigint language plpgsql security definer set search_path='' as $$
declare photo_id bigint;
begin
  perform id from public.missions where id=p_mission_id and source<>'ai' for update;
  if not found then raise exception 'mission_not_found'; end if;
  if (select count(*) from public.mission_photos where mission_id=p_mission_id)>=4 then raise exception 'photo_limit'; end if;
  if p_storage_path is null or p_storage_path not like p_mission_id::text||'/%'
    or p_hint is null or length(p_hint)>2000 then raise exception 'invalid_request'; end if;
  insert into public.mission_photos(mission_id,storage_path,hint) values(p_mission_id,p_storage_path,p_hint) returning id into photo_id;
  return photo_id;
end $$;

revoke all on function public.check_admin_attempt(text,boolean,integer) from public,anon,authenticated;
revoke all on function public.admin_delete_mission(uuid) from public,anon,authenticated;
revoke all on function public.admin_attach_photo(uuid,text,text) from public,anon,authenticated;
grant execute on function public.check_admin_attempt(text,boolean,integer) to service_role;
grant execute on function public.admin_delete_mission(uuid) to service_role;
grant execute on function public.admin_attach_photo(uuid,text,text) to service_role;
