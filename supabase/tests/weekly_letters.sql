-- 로컬 DB에서 실행하며 테스트 데이터는 롤백한다.
begin;
grant usage on schema auth to authenticated;
insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000031'),
  ('10000000-0000-4000-8000-000000000032');
insert into public.weekly_letters (user_id, week_start, body, source, input_hash) values
  ('10000000-0000-4000-8000-000000000031', '2026-10-26', '편지', 'ai', 'hash');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000031', true);
set local role authenticated;
do $$
begin
  assert (select count(*) = 1 from public.weekly_letters), '본인 편지 조회';
  begin
    update public.weekly_letters set body = '변경';
    raise exception '클라이언트 편지 변경이 허용됨';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000032', true);
do $$
begin
  assert (select count(*) = 0 from public.weekly_letters), '타인 편지 조회 차단';
  begin
    insert into public.weekly_letters (user_id, week_start, body, source, input_hash)
      values ('10000000-0000-4000-8000-000000000032', '2026-10-26', '직접 작성', 'ai', 'hash');
    raise exception '클라이언트 편지 생성이 허용됨';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
