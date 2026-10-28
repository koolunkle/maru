create table public.recommendation_requests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id text not null,
  rec_date date not null,
  refresh boolean not null,
  response jsonb not null,
  primary key (user_id, request_id)
);
alter table public.recommendation_requests enable row level security;
revoke all on public.recommendation_requests from public, anon, authenticated;
grant all on public.recommendation_requests to service_role;

create function public.save_recommendation(
  p_user_id uuid, p_date date, p_refresh boolean, p_request_id text,
  p_expected_count integer, p_daily_ids uuid[], p_weekly_id uuid, p_ai_missions jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_rec public.daily_recommendations%rowtype;
  response jsonb;
  item jsonb;
  mission_id uuid;
  ids uuid[] := '{}';
  daily_json jsonb;
  weekly_json jsonb;
begin
  if p_user_id is null or p_date is null or p_refresh is null or p_expected_count is null
    or p_request_id is null or length(p_request_id) not between 1 and 100 then raise exception 'invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 2));
  select r.response into response from public.recommendation_requests r where r.user_id = p_user_id and r.request_id = p_request_id
    and r.rec_date = p_date and r.refresh = p_refresh;
  if found then return response; end if;
  if exists (select 1 from public.recommendation_requests r where r.user_id = p_user_id and r.request_id = p_request_id) then
    raise exception 'request_body_changed';
  end if;
  select * into current_rec from public.daily_recommendations where user_id = p_user_id and rec_date = p_date;
  if found and p_refresh and current_rec.refresh_count >= 1 then raise exception 'refresh_limit'; end if;
  if (current_rec.user_id is not null and (not p_refresh or p_expected_count <> current_rec.refresh_count)) then
    ids := current_rec.daily_mission_ids;
    p_weekly_id := current_rec.weekly_mission_id;
  else
    if p_ai_missions is not null then
      if jsonb_typeof(p_ai_missions) <> 'array' or jsonb_array_length(p_ai_missions) <> 4 then raise exception 'invalid_missions'; end if;
      for item in select * from jsonb_array_elements(p_ai_missions) loop
        insert into public.missions (source, created_for, title, category, difficulty, minutes, verify_hint, reason, event_id)
        values ('ai', p_user_id, item->>'title', (item->>'category')::public.mission_category,
          (item->>'difficulty')::int, (item->>'minutes')::int, item->>'verify_hint', item->>'reason', nullif(item->>'event_id', '')::uuid)
        returning id into mission_id;
        ids := array_append(ids, mission_id);
      end loop;
      p_weekly_id := ids[4];
      ids := ids[1:3];
    else
      ids := p_daily_ids;
    end if;
    insert into public.daily_recommendations(user_id, rec_date, daily_mission_ids, weekly_mission_id, refresh_count)
    values (p_user_id, p_date, ids, p_weekly_id, case when current_rec.user_id is null then 0 else current_rec.refresh_count + 1 end)
    on conflict (user_id, rec_date) do update set daily_mission_ids = excluded.daily_mission_ids,
      weekly_mission_id = excluded.weekly_mission_id, refresh_count = excluded.refresh_count;
  end if;
  select coalesce(jsonb_agg(to_jsonb(m) order by a.ordinality), '[]'::jsonb) into daily_json
    from unnest(ids) with ordinality a(id, ordinality) join public.missions m on m.id = a.id;
  select to_jsonb(m) into weekly_json from public.missions m where m.id = p_weekly_id;
  response := jsonb_build_object('daily', daily_json, 'weekly', weekly_json,
    'source', case when exists (select 1 from public.missions where id = any(ids) and source = 'ai') then 'ai' else 'rule' end);
  insert into public.recommendation_requests(user_id, request_id, rec_date, refresh, response) values (p_user_id, p_request_id, p_date, p_refresh, response);
  return response;
end;
$$;
revoke all on function public.save_recommendation(uuid, date, boolean, text, integer, uuid[], uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_recommendation(uuid, date, boolean, text, integer, uuid[], uuid, jsonb) to service_role;
