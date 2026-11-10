-- 릴레이 한 줄마다 같은 미션의 글인지 함께 돌려준다(change label-similar-mission-relays).
-- 반환 형태가 바뀌어 create or replace가 안 되므로 다시 만든다. 고르는 규칙은 그대로다.
drop function public.get_relay_messages(uuid);

create function public.get_relay_messages(mission uuid)
returns table (body text, same_mission boolean) language sql stable security definer set search_path = '' as $$
  with target as (
    select m.id, m.category from public.missions m
    where m.id = mission and (m.source <> 'ai' or m.created_for = (select auth.uid()))
  )
  select r.body, r.mission_id = t.id from public.relay_messages r join target t on true
  where r.status = 'published' and r.user_id <> (select auth.uid())
    and (r.mission_id = t.id or (r.category = t.category and r.created_at >= now() - interval '7 days'))
  order by (r.mission_id = t.id) desc, r.created_at desc, r.id desc
  limit 3;
$$;
revoke execute on function public.get_relay_messages(uuid) from public, anon;
grant execute on function public.get_relay_messages(uuid) to authenticated;
