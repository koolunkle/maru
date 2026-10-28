create function public.place_furniture(p_user_id uuid, p_slot public.room_slot, p_furniture_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user_id is null or p_slot is null then raise exception 'invalid_placement'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));
  if p_furniture_id is not null and not exists (
    select 1 from public.user_furniture uf join public.furniture f on f.id = uf.furniture_id
    where uf.user_id = p_user_id and uf.furniture_id = p_furniture_id
      and f.slot_type::text = split_part(p_slot::text, '-', 1)
  ) then raise exception 'invalid_placement'; end if;
  update public.user_furniture set slot = null
    where user_id = p_user_id and slot = p_slot and furniture_id is distinct from p_furniture_id;
  if p_furniture_id is not null then
    update public.user_furniture set slot = p_slot where user_id = p_user_id and furniture_id = p_furniture_id;
  end if;
end;
$$;
revoke all on function public.place_furniture(uuid, public.room_slot, text) from public, anon, authenticated;
grant execute on function public.place_furniture(uuid, public.room_slot, text) to service_role;
