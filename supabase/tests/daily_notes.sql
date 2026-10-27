-- 로컬 DB에서 실행하며 테스트 데이터는 롤백한다.
begin;
grant usage on schema auth to authenticated;
insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000021'),
  ('10000000-0000-4000-8000-000000000022');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000021', true);
set local role authenticated;
select public.save_daily_note('10000000-0000-4000-8000-000000000021', (now() at time zone 'Asia/Seoul')::date, 1::smallint, '오늘 한 줄');
select public.save_daily_note('10000000-0000-4000-8000-000000000021', (now() at time zone 'Asia/Seoul')::date, 5::smallint, '수정한 한 줄');
do $$
begin
  assert (select count(*) = 1 from public.daily_notes), '같은 날 저장은 한 행만 유지';
  assert (select mood = 5 and text = '수정한 한 줄' and note_date = (now() at time zone 'Asia/Seoul')::date from public.daily_notes), '한국 시간 날짜와 수정 내용 저장';
  begin
    perform public.save_daily_note('10000000-0000-4000-8000-000000000021', (now() at time zone 'Asia/Seoul')::date, 6::smallint, '잘못된 기분');
    raise exception '잘못된 기분이 허용됨';
  exception when check_violation then null; end;
  begin
    perform public.save_daily_note('10000000-0000-4000-8000-000000000021', (now() at time zone 'Asia/Seoul')::date, 3::smallint, repeat('가', 61));
    raise exception '61자 기록이 허용됨';
  exception when check_violation then null; end;
  begin
    update public.daily_notes set user_id = '10000000-0000-4000-8000-000000000022';
    raise exception '사용자 변경이 허용됨';
  exception when insufficient_privilege then null; end;
  assert not exists (select 1 from public.save_daily_note('10000000-0000-4000-8000-000000000021', (now() at time zone 'Asia/Seoul')::date - 1, 3::smallint, '이전 날짜')), '날짜가 바뀐 후 이전 날짜로 저장 방지';
  begin
    insert into public.daily_notes (user_id, note_date, mood) values ('10000000-0000-4000-8000-000000000021', '2020-01-01', 1);
    raise exception '임의 날짜 생성이 허용됨';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000022', true);
do $$
begin
  assert (select count(*) = 0 from public.daily_notes), '다른 계정의 기록 조회 차단';
  assert not exists (select 1 from public.save_daily_note('10000000-0000-4000-8000-000000000021', (now() at time zone 'Asia/Seoul')::date, 2::smallint, '타인 기록 변경')), '타인 계정으로 저장 차단';
  update public.daily_notes set text = '타인 변경' where user_id = '10000000-0000-4000-8000-000000000021';
  delete from public.daily_notes where user_id = '10000000-0000-4000-8000-000000000021';
end $$;
select public.save_daily_note('10000000-0000-4000-8000-000000000022', (now() at time zone 'Asia/Seoul')::date, 3::smallint, '');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000021', true);
do $$
begin
  assert (select text = '수정한 한 줄' from public.daily_notes), '타인의 수정·삭제는 적용되지 않음';
  delete from public.daily_notes where user_id = '10000000-0000-4000-8000-000000000021';
  assert (select count(*) = 0 from public.daily_notes), '본인 기록 삭제';
end $$;
reset role;
do $$ begin assert (select count(*) = 1 from public.daily_notes), '다른 계정 기록은 보존'; end $$;
set local role anon;
do $$
begin
  begin
    perform * from public.daily_notes;
    raise exception '미인증 조회가 허용됨';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_daily_note('10000000-0000-4000-8000-000000000021', (now() at time zone 'Asia/Seoul')::date, 1::smallint, '');
    raise exception '미인증 저장이 허용됨';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
