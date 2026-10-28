-- F16: 캡슐 본문은 열리는 날에만 서버 함수로 제공한다.
create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id text not null,
  body text not null check (char_length(btrim(body)) between 1 and 100),
  open_on date not null,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, request_id)
);
alter table public.time_capsules enable row level security;
revoke all on public.time_capsules from public, anon, authenticated;
grant all on public.time_capsules to service_role;

create function public.list_time_capsules()
returns table (id uuid, open_on date, opened_at timestamptz, created_at timestamptz, body text, days_ago integer, ready boolean)
language sql security definer set search_path = '' as $$
  select c.id, c.open_on, c.opened_at, c.created_at,
    case when c.opened_at is not null then c.body else null end,
    ((now() at time zone 'Asia/Seoul')::date - (c.created_at at time zone 'Asia/Seoul')::date),
    c.open_on <= (now() at time zone 'Asia/Seoul')::date
  from public.time_capsules c where c.user_id = (select auth.uid()) order by c.created_at desc;
$$;
create function public.send_time_capsule(p_body text, p_days integer, p_request_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or p_body is null or char_length(btrim(p_body)) not between 1 and 100
    or p_days is null or p_days not in (7, 30, 100) or p_request_id is null or length(p_request_id) not between 1 and 100 then
    raise exception 'invalid capsule';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  if exists (select 1 from public.time_capsules where user_id = v_user and request_id = p_request_id) then return; end if;
  if (select count(*) from public.time_capsules where user_id = v_user and open_on > (now() at time zone 'Asia/Seoul')::date) >= 5 then
    raise exception 'capsule limit';
  end if;
  insert into public.time_capsules(user_id, request_id, body, open_on)
  values (v_user, p_request_id, btrim(p_body), (now() at time zone 'Asia/Seoul')::date + p_days);
end;
$$;
create function public.open_time_capsule(p_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_body text;
begin
  update public.time_capsules set opened_at = coalesce(opened_at, now())
  where id = p_id and user_id = auth.uid() and open_on <= (now() at time zone 'Asia/Seoul')::date
  returning body into v_body;
  if v_body is null then raise exception 'capsule unavailable'; end if;
  return v_body;
end;
$$;
revoke all on function public.list_time_capsules(), public.send_time_capsule(text, integer, text), public.open_time_capsule(uuid) from public, anon;
grant execute on function public.list_time_capsules(), public.send_time_capsule(text, integer, text), public.open_time_capsule(uuid) to authenticated;
