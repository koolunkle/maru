-- 같은 요청 ID는 같은 본문과 보관 기간에만 재사용한다.
create or replace function public.send_time_capsule(p_body text, p_days integer, p_request_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  existing public.time_capsules%rowtype;
begin
  if v_user is null or p_body is null or char_length(btrim(p_body)) not between 1 and 100
    or p_days is null or p_days not in (7, 30, 100) or p_request_id is null or length(p_request_id) not between 1 and 100 then
    raise exception 'invalid capsule';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  select * into existing from public.time_capsules where user_id = v_user and request_id = p_request_id;
  if found then
    if existing.body is distinct from btrim(p_body)
      or existing.open_on - (existing.created_at at time zone 'Asia/Seoul')::date <> p_days then
      raise exception 'request_body_changed';
    end if;
    return;
  end if;
  if (select count(*) from public.time_capsules where user_id = v_user and open_on > (now() at time zone 'Asia/Seoul')::date) >= 5 then
    raise exception 'capsule limit';
  end if;
  insert into public.time_capsules(user_id, request_id, body, open_on)
  values (v_user, p_request_id, btrim(p_body), (now() at time zone 'Asia/Seoul')::date + p_days);
end;
$$;
