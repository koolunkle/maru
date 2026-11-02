-- 로컬 PostgreSQL에서만 실행하며 전부 롤백한다.
begin;
insert into auth.users (id) values ('10000000-0000-4000-8000-000000000091');
update public.profiles set onboarded_at = now(), categories = '{walk}' where id = '10000000-0000-4000-8000-000000000091';

do $$
declare
  u uuid := '10000000-0000-4000-8000-000000000091';
  day date := (now() at time zone 'Asia/Seoul')::date;
  a uuid; b uuid; c uuid; d uuid; w uuid; future uuid; response jsonb; again jsonb; ids uuid[]; due timestamptz;
begin
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint,start_date,end_date)
    values ('seed','경계','walk',1,5,'하늘',day,day) returning id into a;
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint)
    values ('seed','기존','walk',1,5,'하늘') returning id into b;
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint)
    values ('seed','보충','walk',1,5,'하늘') returning id into c;
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint)
    values ('seed','주간','walk',3,30,'하늘') returning id into w;
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint,start_date)
    values ('seed','아직','walk',1,5,'하늘',day+1) returning id into future;
  response := public.save_recommendation(u,day,false,'initial',-1,array[a,b,c],w,null);
  assert jsonb_array_length(response->'daily') = 3, '당일 양 끝 경계 포함';
  again := public.save_recommendation(u,day,false,'initial',-1,'{}',null,null);
  assert again = response, '동일 요청 결과 보존';
  insert into public.user_missions(user_id,mission_id,type,due_at) values (u,w,'weekly',now()+interval '3 days') returning due_at into due;
  update public.missions set start_date = null, end_date = day-1 where id in (a,w);
  again := public.save_recommendation(u,day,false,'initial',-1,'{}',null,null);
  assert jsonb_array_length(again->'daily') = 2, '후보 부족 시 가능한 수만 반환';
  assert again->'weekly' = 'null'::jsonb, '기간 밖 주간 미션 제외';
  assert again->'daily'->0->>'id' = b::text, '유효한 기존 순서 보존';
  assert (select refresh_count = 0 from public.daily_recommendations where user_id=u), '자동 보충은 새로고침 미소모';
  assert (select due_at = due and status = 'in_progress' from public.user_missions where user_id=u), '진행 중 수행 기한 유지';
  response := public.save_recommendation(u,day,true,'refresh',0,array[b,c,future],null,null);
  assert jsonb_array_length(response->'daily') = 2, '신규 저장도 기간 검사';
  assert (select refresh_count = 1 from public.daily_recommendations where user_id=u), '새로고침 한 번';
  assert public.save_recommendation(u,day,true,'refresh',0,'{}',null,null) = response, '새로고침 재시도 미소모';
  begin
    perform public.save_recommendation(u,day,true,'second',1,'{}',null,null);
    raise exception '새로고침 제한 누락';
  exception when raise_exception then assert sqlerrm = 'refresh_limit'; end;
  begin
    perform public.save_recommendation(u,day,false,'refresh',0,'{}',null,null);
    raise exception '동일 요청 본문 검사 누락';
  exception when raise_exception then assert sqlerrm = 'request_body_changed'; end;
  begin
    update public.missions set start_date=day+1,end_date=day where id=b;
    raise exception '기간 순서 제약 누락';
  exception when check_violation then null; end;
  insert into public.missions(source,title,category,difficulty,minutes,verify_hint)
    values ('seed','추가','walk',1,5,'하늘') returning id into d;
  update public.daily_recommendations set daily_mission_ids=array[c,d,b] where user_id=u;
  perform public.save_recommendation(u,day,false,'initial',-1,'{}',null,null);
  assert (select daily_mission_ids=array[c,d,b] from public.daily_recommendations where user_id=u), '과거 요청 재시도로 현재 추천을 덮어쓰지 않음';
  -- 같은 시점의 두 요청 중 후행 저장도 기존 추천과 횟수를 유지한다.
  perform public.save_recommendation(u,day,false,'late-initial',-1,array[b],null,null);
  assert (select refresh_count=1 and daily_mission_ids=array[c,d,b] from public.daily_recommendations where user_id=u), '늦게 온 저장은 중복 생성·횟수 변경 없음';
end;
$$;

set local role authenticated;
do $$ begin
  begin
    perform * from public.mission_photos;
    raise exception '기준 사진 경로 공개';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
