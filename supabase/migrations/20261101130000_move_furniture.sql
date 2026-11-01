-- 내 방 가구 옮기기를 한 트랜잭션으로 처리한다 (spec room-rewards "옮길 자리에 가구가 있으면 서로 바꾼다").
-- 지금까지 앱은 place_furniture를 두 번 불러 자리를 바꿨고, 두 번째 호출이 실패하면 원래 있던 가구가 방에서 빠졌다.
create function public.move_furniture(p_user_id uuid, p_furniture_id text, p_slot public.room_slot)
returns void language plpgsql security definer set search_path = '' as $$
declare
  from_slot public.room_slot;
  occupant text;
begin
  if p_user_id is null or p_furniture_id is null or p_slot is null then raise exception 'invalid_placement'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));

  select uf.slot into from_slot
    from public.user_furniture uf join public.furniture f on f.id = uf.furniture_id
    where uf.user_id = p_user_id and uf.furniture_id = p_furniture_id
      and f.slot_type::text = split_part(p_slot::text, '-', 1);
  if not found then raise exception 'invalid_placement'; end if;
  if from_slot is not distinct from p_slot then return; end if;

  select furniture_id into occupant from public.user_furniture
    where user_id = p_user_id and slot = p_slot;

  -- (user_id, slot) 고유 인덱스를 지키는 순서: 옮길 가구를 빼고 → 원래 있던 가구를 빈 자리로 → 옮길 가구를 놓는다.
  -- 옮길 가구가 아직 놓이지 않았던 가구(from_slot이 null)라면 원래 있던 가구는 place_furniture와 같이 방에서 빠진다.
  update public.user_furniture set slot = null where user_id = p_user_id and furniture_id = p_furniture_id;
  if occupant is not null then
    update public.user_furniture set slot = from_slot where user_id = p_user_id and furniture_id = occupant;
  end if;
  update public.user_furniture set slot = p_slot where user_id = p_user_id and furniture_id = p_furniture_id;
end;
$$;
revoke all on function public.move_furniture(uuid, text, public.room_slot) from public, anon, authenticated;
grant execute on function public.move_furniture(uuid, text, public.room_slot) to service_role;
