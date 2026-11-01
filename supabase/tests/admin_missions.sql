-- 로컬 PostgreSQL 전용. 모든 자료는 롤백한다.
begin;
do $$
declare key text:=repeat('a',64); m uuid; protected uuid; u uuid:=gen_random_uuid(); i integer;
begin
  for i in 1..5 loop assert public.check_admin_attempt(key,false), '처음 5회는 처리'; end loop;
  assert not public.check_admin_attempt(key,true), '잠금 중 올바른 비밀번호도 제한';
  update public.admin_login_attempts set window_start=now()-interval '11 minutes' where key_hash=key;
  assert public.check_admin_attempt(key,true), '시간 창 이후 재시도';
  assert (select failures=0 from public.admin_login_attempts where key_hash=key);
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint)
    values('seed','관리 검증','walk',1,5,'하늘') returning id into m;
  for i in 1..4 loop perform public.admin_attach_photo(m,m::text||'/'||i||'.jpg','힌트'); end loop;
  begin
    perform public.admin_attach_photo(m,m::text||'/5.jpg','힌트');raise exception '사진 개수 제한 누락';
  exception when raise_exception then assert sqlerrm='photo_limit'; end;
  begin
    perform public.admin_delete_mission(m);raise exception '사진 연결 보호 누락';
  exception when raise_exception then assert sqlerrm='mission_has_records'; end;
  delete from public.mission_photos where mission_id=m;
  insert into auth.users(id) values(u);
  insert into public.user_missions(user_id,mission_id,type,due_at) values(u,m,'daily',now()+interval '1 hour');
  begin
    perform public.admin_delete_mission(m);raise exception '사용자 기록 보호 누락';
  exception when raise_exception then assert sqlerrm='mission_has_records'; end;
  assert exists(select 1 from public.user_missions where user_id=u);
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint)
    values('seed','삭제 가능','walk',1,5,'하늘') returning id into protected;
  perform public.admin_delete_mission(protected);
  assert not exists(select 1 from public.missions where id=protected);
  assert not has_table_privilege('authenticated','public.admin_login_attempts','select');
  assert not has_function_privilege('authenticated','public.check_admin_attempt(text,boolean,integer)','execute');
  assert not has_function_privilege('anon','public.admin_delete_mission(uuid)','execute');
end $$;
rollback;
