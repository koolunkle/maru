-- S6 피드: 공개된 통과 인증 + 미션 제목·닉네임 (user_missions·profiles는 RLS로 본인만 읽히므로 RPC로 노출)
create function public.get_feed(before timestamptz default null, page_size int default 20)
returns table (
  id uuid,
  user_id uuid,
  nickname text,
  photo_path text,
  text text,
  created_at timestamptz,
  mission_id uuid,
  mission_title text,
  category public.mission_category
)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id, v.user_id, p.nickname, v.photo_path, v.text, v.created_at, m.id, m.title, m.category
  from public.verifications v
  join public.user_missions um on um.id = v.user_mission_id
  join public.missions m on m.id = um.mission_id
  join public.profiles p on p.id = v.user_id
  where v.is_public and v.ai_result = 'pass'
    and (before is null or v.created_at < before)
  order by v.created_at desc
  limit least(greatest(page_size, 1), 50);
$$;

revoke execute on function public.get_feed(timestamptz, int) from public, anon;
grant execute on function public.get_feed(timestamptz, int) to authenticated;
