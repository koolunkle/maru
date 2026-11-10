-- AI 오늘 미션 중 하루 시간을 넘는 것을 버리고 1~3개만 보내도 저장한다(change drop-overtime-ai-missions).
-- 빈자리는 아래의 기존 보충 로직이 하루 시간 안의 시드부터 채운다. 마지막 항목이 이번 주 미션이다.
create or replace function public.save_recommendation(
  p_user_id uuid, p_date date, p_refresh boolean, p_request_id text,
  p_expected_count integer, p_daily_ids uuid[], p_weekly_id uuid, p_ai_missions jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_rec public.daily_recommendations%rowtype;
  prior public.recommendation_requests%rowtype;
  profile public.profiles%rowtype;
  response jsonb;
  item jsonb;
  mission_id uuid;
  ids uuid[] := '{}';
  original_ids uuid[];
  original_weekly uuid;
  daily_json jsonb;
  weekly_json jsonb;
  new_count integer;
  day date := (now() at time zone 'Asia/Seoul')::date;
begin
  if p_user_id is null or p_date is distinct from day or p_refresh is null or p_expected_count is null
    or p_request_id is null or length(p_request_id) not between 1 and 100 then raise exception 'invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 2));
  select * into profile from public.profiles where id = p_user_id;
  if profile.onboarded_at is null then raise exception 'not_onboarded'; end if;
  select * into prior from public.recommendation_requests where user_id = p_user_id and request_id = p_request_id;
  if prior.user_id is not null and (prior.rec_date <> p_date or prior.refresh <> p_refresh) then
    raise exception 'request_body_changed';
  end if;
  select * into current_rec from public.daily_recommendations where user_id = p_user_id and rec_date = p_date;
  new_count := coalesce(current_rec.refresh_count, 0);
  if prior.user_id is not null then
    select coalesce(array_agg((m->>'id')::uuid order by n), '{}') into ids
      from jsonb_array_elements(prior.response->'daily') with ordinality a(m, n);
    p_weekly_id := (prior.response->'weekly'->>'id')::uuid;
  elsif current_rec.user_id is not null and not p_refresh then
    ids := current_rec.daily_mission_ids;
    p_weekly_id := current_rec.weekly_mission_id;
  else
    if current_rec.user_id is not null and p_refresh and current_rec.refresh_count >= 1 then
      raise exception 'refresh_limit';
    end if;
    if current_rec.user_id is not null and p_expected_count <> current_rec.refresh_count then
      ids := current_rec.daily_mission_ids;
      p_weekly_id := current_rec.weekly_mission_id;
    else
      if p_ai_missions is not null then
        if jsonb_typeof(p_ai_missions) <> 'array' or jsonb_array_length(p_ai_missions) not between 2 and 4 then
          raise exception 'invalid_missions';
        end if;
        for item in select * from jsonb_array_elements(p_ai_missions) loop
          insert into public.missions (source, created_for, title, category, difficulty, minutes, verify_hint, reason, event_id, start_date, end_date)
          select 'ai', p_user_id, item->>'title', (item->>'category')::public.mission_category,
            (item->>'difficulty')::int, (item->>'minutes')::int, item->>'verify_hint', item->>'reason',
            e.id, e.start_date, e.end_date
          from (select 1) singleton left join public.events e on e.id = nullif(item->>'event_id', '')::uuid
          returning id into mission_id;
          ids := array_append(ids, mission_id);
        end loop;
        p_weekly_id := ids[cardinality(ids)];
        ids := ids[1:cardinality(ids) - 1];
      else
        ids := coalesce(p_daily_ids, '{}');
      end if;
      if current_rec.user_id is not null then new_count := current_rec.refresh_count + 1; end if;
    end if;
  end if;
  original_ids := ids;
  original_weekly := p_weekly_id;

  -- 유효한 기존 항목은 순서까지 유지한다. 다른 사용자의 AI 미션은 섞지 않는다.
  select coalesce(array_agg(id order by n), '{}') into ids from (
    select m.id, min(a.n) n from unnest(ids) with ordinality a(id, n)
    join public.missions m on m.id = a.id
    where (m.start_date is null or m.start_date <= day) and (m.end_date is null or m.end_date >= day)
      and (m.source <> 'ai' or m.created_for = p_user_id)
    group by m.id order by n limit 3
  ) valid;
  select m.id into p_weekly_id from public.missions m where m.id = p_weekly_id and not (m.id = any(ids))
    and (m.start_date is null or m.start_date <= day) and (m.end_date is null or m.end_date >= day)
    and (m.source <> 'ai' or m.created_for = p_user_id);
  for mission_id in
    select m.id from public.missions m where m.source = 'seed' and not (m.id = any(ids))
      and m.id is distinct from p_weekly_id and m.difficulty <= profile.difficulty + 1
      and (m.start_date is null or m.start_date <= day) and (m.end_date is null or m.end_date >= day)
    order by (m.minutes <= coalesce(profile.daily_minutes, 5)) desc,
      (m.category = any(profile.categories)) desc, random()
    limit greatest(0, 3 - cardinality(ids))
  loop
    ids := array_append(ids, mission_id);
  end loop;
  if p_weekly_id is null then
    select m.id into p_weekly_id from public.missions m where m.source = 'seed' and not (m.id = any(ids))
      and m.difficulty >= profile.difficulty + 1
      and (m.start_date is null or m.start_date <= day) and (m.end_date is null or m.end_date >= day)
    order by (m.category = any(profile.categories)) desc, random() limit 1;
  end if;
  -- 과거 요청의 재시도가 새로 받은 추천을 되돌리지 않게 한다.
  if prior.user_id is null or (current_rec.daily_mission_ids = original_ids
    and current_rec.weekly_mission_id is not distinct from original_weekly) then
    insert into public.daily_recommendations(user_id, rec_date, daily_mission_ids, weekly_mission_id, refresh_count)
    values (p_user_id, p_date, ids, p_weekly_id, new_count)
    on conflict (user_id, rec_date) do update set daily_mission_ids = excluded.daily_mission_ids,
      weekly_mission_id = excluded.weekly_mission_id, refresh_count = excluded.refresh_count;
  end if;
  select coalesce(jsonb_agg(to_jsonb(m) order by a.n), '[]'::jsonb) into daily_json
    from unnest(ids) with ordinality a(id, n) join public.missions m on m.id = a.id;
  select to_jsonb(m) into weekly_json from public.missions m where m.id = p_weekly_id;
  response := jsonb_build_object('daily', daily_json, 'weekly', weekly_json,
    'source', case when exists (select 1 from public.missions where id = any(ids) and source = 'ai') then 'ai' else 'rule' end);
  insert into public.recommendation_requests(user_id, request_id, rec_date, refresh, response)
  values (p_user_id, p_request_id, p_date, p_refresh, response)
  on conflict (user_id, request_id) do update set response = excluded.response;
  return response;
end;
$$;
