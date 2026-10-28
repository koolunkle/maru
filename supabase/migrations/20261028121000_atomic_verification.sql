-- 판정 결과와 미션·출석·보상은 하나의 트랜잭션에서 확정한다.
create table public.verification_responses (
  verification_id uuid primary key references public.verifications(id) on delete cascade,
  response jsonb not null
);
alter table public.verification_responses enable row level security;
revoke all on public.verification_responses from public, anon, authenticated;
grant all on public.verification_responses to service_role;

create function public.finish_verification(
  p_user_id uuid, p_verification_id uuid, p_result public.verification_result,
  p_message text, p_judged_by text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v public.verifications%rowtype;
  mission public.user_missions%rowtype;
  profile public.profiles%rowtype;
  today date := (now() at time zone 'Asia/Seoul')::date;
  week date := date_trunc('week', now() at time zone 'Asia/Seoul')::date;
  rewards jsonb := '[]'::jsonb;
  response jsonb;
begin
  if p_user_id is null or p_result is null or p_message is null or p_judged_by is null or p_judged_by not in ('ai', 'rule') then
    raise exception 'invalid_judgement';
  end if;
  -- 사용자 단위 직렬화는 동시 출석 계산과 난이도 트리거의 잠금 순서를 맞춘다.
  select * into profile from public.profiles where id = p_user_id for update;
  if not found then raise exception 'user_not_found'; end if;
  select * into v from public.verifications where id = p_verification_id and user_id = p_user_id for update;
  if not found then raise exception 'verification_not_found'; end if;
  select r.response into response from public.verification_responses r where r.verification_id = v.id;
  if found then return response; end if;
  if v.ai_result is not null then raise exception 'already_judged'; end if;
  select * into mission from public.user_missions where id = v.user_mission_id and user_id = p_user_id for update;
  if not found or mission.status not in ('in_progress', 'judging') then raise exception 'mission_not_active'; end if;

  update public.verifications set ai_result = p_result, ai_message = p_message,
    is_public = case when p_result = 'privacy' then false else is_public end
  where id = v.id;
  if p_result = 'retry' then
    update public.user_missions set status = 'in_progress' where id = mission.id;
    response := jsonb_build_object('result', p_result, 'message', p_message, 'streak', null, 'rewards', rewards, 'judged_by', p_judged_by);
  else
    update public.user_missions set status = 'completed', completed_at = now() where id = mission.id;
    if profile.last_attended is distinct from today then
      if profile.last_attended = today - 1 then
        profile.streak := profile.streak + 1;
      elsif profile.last_attended = today - 2 and profile.rest_used_week is distinct from week then
        profile.streak := profile.streak + 1;
        profile.rest_used_week := week;
      else
        profile.streak := 1;
      end if;
      update public.profiles set streak = profile.streak, last_attended = today,
        rest_used_week = profile.rest_used_week where id = p_user_id;
    end if;
    with earned as (
      insert into public.user_furniture(user_id, furniture_id)
      select p_user_id, f.id from public.furniture f
      where case f.unlock_rule->>'type'
        when 'first_mission' then true
        when 'streak' then profile.streak >= (f.unlock_rule->>'days')::int
        when 'category_count' then (select count(*) from public.user_missions um join public.missions m on m.id = um.mission_id
          where um.user_id = p_user_id and um.status = 'completed' and m.category::text = f.unlock_rule->>'category') >= (f.unlock_rule->>'count')::int
        when 'first_weekly' then exists (select 1 from public.user_missions um where um.user_id = p_user_id and um.status = 'completed' and um.type = 'weekly')
        when 'event_mission' then exists (select 1 from public.user_missions um join public.missions m on m.id = um.mission_id
          where um.user_id = p_user_id and um.status = 'completed' and m.event_id is not null)
        else false end
      on conflict (user_id, furniture_id) do nothing returning furniture_id
    )
    select coalesce(jsonb_agg(to_jsonb(f) order by f.sort), '[]'::jsonb) into rewards
    from earned e join public.furniture f on f.id = e.furniture_id;
    response := jsonb_build_object('result', p_result, 'message', p_message, 'streak', profile.streak, 'rewards', rewards, 'judged_by', p_judged_by);
  end if;
  insert into public.verification_responses(verification_id, response) values (v.id, response);
  return response;
end;
$$;
revoke all on function public.finish_verification(uuid, uuid, public.verification_result, text, text) from public, anon, authenticated;
grant execute on function public.finish_verification(uuid, uuid, public.verification_result, text, text) to service_role;
