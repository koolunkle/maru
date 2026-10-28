-- 동시 생성 요청이 같은 버전을 두 번 갱신하지 않도록 갱신 시각을 증가시킨다.
create function public.stamp_weekly_letter_version() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;
create trigger weekly_letter_version before update on public.weekly_letters
  for each row execute function public.stamp_weekly_letter_version();
revoke all on function public.stamp_weekly_letter_version() from public, anon, authenticated;
