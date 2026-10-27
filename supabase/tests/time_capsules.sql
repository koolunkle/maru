-- 격리된 로컬 DB에서 실행하며 모든 데이터를 롤백한다.
begin;
grant usage on schema auth to authenticated;
insert into auth.users (id) values ('10000000-0000-4000-8000-000000000031'), ('10000000-0000-4000-8000-000000000032');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000031', true);
set local role authenticated;
select public.send_time_capsule('미래의 나에게', 7, 'one');
select public.send_time_capsule('미래의 나에게', 7, 'one');
select set_config('test.capsule_id', (select id::text from public.list_time_capsules() limit 1), true);
do $$
declare capsule_id uuid;
begin
  assert (select count(*) = 1 from public.list_time_capsules()), '같은 요청은 한 번만 저장';
  assert (select body is null and not ready and open_on = (now() at time zone 'Asia/Seoul')::date + 7 from public.list_time_capsules()), '잠긴 본문 숨김과 한국 날짜';
  select id into capsule_id from public.list_time_capsules();
  begin perform public.open_time_capsule(capsule_id); raise exception '조기 열기 허용'; exception when raise_exception then if sqlerrm = '조기 열기 허용' then raise; end if; end;
  begin perform public.send_time_capsule(' ', 7, 'empty'); raise exception '빈 내용 허용'; exception when raise_exception then if sqlerrm = '빈 내용 허용' then raise; end if; end;
  begin perform public.send_time_capsule('내용', 8, 'day'); raise exception '잘못된 날짜 허용'; exception when raise_exception then if sqlerrm = '잘못된 날짜 허용' then raise; end if; end;
end $$;
select public.send_time_capsule('둘', 30, 'two');
select public.send_time_capsule('셋', 100, 'three');
select public.send_time_capsule('넷', 7, 'four');
select public.send_time_capsule('다섯', 7, 'five');
do $$ begin
  begin perform public.send_time_capsule('여섯', 7, 'six'); raise exception '6개 허용'; exception when raise_exception then if sqlerrm = '6개 허용' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000032', true);
do $$ begin
  assert (select count(*) = 0 from public.list_time_capsules()), '다른 사용자 조회 차단';
  begin perform public.open_time_capsule(current_setting('test.capsule_id')::uuid); raise exception '타인 열기 허용'; exception when raise_exception then if sqlerrm = '타인 열기 허용' then raise; end if; end;
  begin perform * from public.time_capsules; raise exception '직접 조회 허용'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.time_capsules set open_on = (now() at time zone 'Asia/Seoul')::date where request_id = 'one';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000031', true);
do $$ declare capsule_id uuid; begin
  select id into capsule_id from public.list_time_capsules() where ready;
  assert (select body is null from public.list_time_capsules() where id = capsule_id), '열기 전 본문 숨김';
  assert public.open_time_capsule(capsule_id) = '미래의 나에게', '도착한 본문 열기';
  assert (select opened_at is not null and body = '미래의 나에게' from public.list_time_capsules() where id = capsule_id), '열람 기록 저장';
end $$;
reset role;
rollback;
