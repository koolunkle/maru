-- '같이 할래요' 참여자 닉네임 최대 3개 (PRD F9)
create function public.get_participant_nicknames(mission uuid)
returns table (nickname text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.nickname
  from public.mission_participants mp
  join public.profiles p on p.id = mp.user_id
  where mp.mission_id = mission
  order by mp.created_at desc
  limit 3;
$$;

revoke execute on function public.get_participant_nicknames(uuid) from public, anon;
grant execute on function public.get_participant_nicknames(uuid) to authenticated;
