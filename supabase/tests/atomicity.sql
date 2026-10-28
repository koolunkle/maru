-- 격리된 DB에서 실행하며 모든 데이터를 롤백한다.
begin;
do $$ begin
  assert not has_function_privilege('authenticated', 'public.finish_verification(uuid,uuid,public.verification_result,text,text)', 'execute'), '인증 확정은 서버 전용';
  assert not has_function_privilege('authenticated', 'public.place_furniture(uuid,public.room_slot,text)', 'execute'), '가구 변경 함수는 서버 전용';
  assert not has_table_privilege('authenticated', 'public.verification_responses', 'select'), '판정 응답은 비공개';
end $$;
insert into auth.users (id) values ('10000000-0000-4000-8000-000000000091');
insert into public.user_missions (id, user_id, mission_id, type, due_at)
select '20000000-0000-4000-8000-000000000091', '10000000-0000-4000-8000-000000000091', id, 'daily', now() + interval '1 day'
from public.missions where seed_no = 1;
insert into public.verifications (id, user_id, user_mission_id, photo_path)
values ('30000000-0000-4000-8000-000000000091', '10000000-0000-4000-8000-000000000091', '20000000-0000-4000-8000-000000000091', 'test.jpg');
do $$
declare first_result jsonb; second_result jsonb;
begin
  first_result := public.finish_verification('10000000-0000-4000-8000-000000000091', '30000000-0000-4000-8000-000000000091', 'pass', '잘했어요', 'ai');
  second_result := public.finish_verification('10000000-0000-4000-8000-000000000091', '30000000-0000-4000-8000-000000000091', 'retry', '다른 결과', 'rule');
  assert first_result = second_result, '재시도는 최초 결과를 반환';
  assert (select status = 'completed' from public.user_missions where id = '20000000-0000-4000-8000-000000000091'), '완료 기록';
  assert (select streak = 1 from public.profiles where id = '10000000-0000-4000-8000-000000000091'), '출석 기록';
  assert (select count(*) = 1 from public.user_furniture where user_id = '10000000-0000-4000-8000-000000000091' and furniture_id = 'plant'), '보상 중복 방지';
  perform public.place_furniture('10000000-0000-4000-8000-000000000091', 'window', 'plant');
  perform public.place_furniture('10000000-0000-4000-8000-000000000091', 'window', 'plant');
  begin
    perform public.place_furniture('10000000-0000-4000-8000-000000000091', 'window', 'missing');
    raise exception '소유하지 않은 가구 허용';
  exception when raise_exception then if sqlerrm <> 'invalid_placement' then raise; end if; end;
  assert (select slot = 'window' from public.user_furniture where user_id = '10000000-0000-4000-8000-000000000091' and furniture_id = 'plant'), '실패해도 기존 배치 유지';
end $$;
do $$
declare mission_id uuid; started uuid; again uuid; comment jsonb;
begin
  select id into mission_id from public.missions where seed_no = 2;
  started := public.start_mission('10000000-0000-4000-8000-000000000091', mission_id, 'daily', now() + interval '1 day');
  again := public.start_mission('10000000-0000-4000-8000-000000000091', mission_id, 'daily', now() + interval '1 day');
  assert started = again, '미션 시작 재시도';
  update public.verifications set is_public = true where id = '30000000-0000-4000-8000-000000000091';
  comment := public.submit_comment('10000000-0000-4000-8000-000000000091', '30000000-0000-4000-8000-000000000091', '응원해요', 'comment-1');
  assert comment = public.submit_comment('10000000-0000-4000-8000-000000000091', '30000000-0000-4000-8000-000000000091', '응원해요', 'comment-1'), '댓글 재시도';
  begin
    perform public.submit_comment('10000000-0000-4000-8000-000000000091', '30000000-0000-4000-8000-000000000091', '다른 댓글', 'comment-1');
    raise exception '변경된 댓글 허용';
  exception when raise_exception then if sqlerrm <> 'request_body_changed' then raise; end if; end;
end $$;
do $$
declare mission_id uuid; started uuid; v_id uuid := '30000000-0000-4000-8000-000000000092';
begin
  select id into mission_id from public.missions where seed_no = 3;
  started := public.start_mission('10000000-0000-4000-8000-000000000091', mission_id, 'daily', now() + interval '1 day');
  insert into public.verifications(id, user_id, user_mission_id, photo_path)
    values (v_id, '10000000-0000-4000-8000-000000000091', started, 'rollback.jpg');
  insert into public.furniture(id, name, slot_type, unlock_rule, sort)
    values ('bad-rule', 'test', 'desk', '{"type":"streak","days":"invalid"}', 99);
  begin
    perform public.finish_verification('10000000-0000-4000-8000-000000000091', v_id, 'pass', 'test', 'ai');
    raise exception '잘못된 보상 허용';
  exception when invalid_text_representation then null; end;
  assert (select ai_result is null from public.verifications where id = v_id), '오류 시 인증 롤백';
  assert (select status = 'in_progress' from public.user_missions where id = started), '오류 시 완료 롤백';
  assert not exists (select 1 from public.verification_responses where verification_id = v_id), '오류 시 응답 롤백';
  delete from public.furniture where id = 'bad-rule';
end $$;
do $$
declare ids uuid[]; weekly uuid; initial jsonb; refreshed jsonb; ai_rows jsonb; before_count int;
begin
  select array_agg(id order by seed_no) into ids from public.missions where seed_no between 1 and 3;
  select id into weekly from public.missions where seed_no = 4;
  initial := public.save_recommendation('10000000-0000-4000-8000-000000000091', current_date, false, 'initial', -1, ids, weekly, null);
  assert initial = public.save_recommendation('10000000-0000-4000-8000-000000000091', current_date, false, 'initial', -1, ids, weekly, null), '추천 재시도 결과';
  refreshed := public.save_recommendation('10000000-0000-4000-8000-000000000091', current_date, true, 'refresh', 0, ids, weekly, null);
  assert refreshed = public.save_recommendation('10000000-0000-4000-8000-000000000091', current_date, true, 'refresh', 0, ids, weekly, null), '새로고침 재시도 결과';
  begin
    perform public.save_recommendation('10000000-0000-4000-8000-000000000091', current_date, true, 'second-refresh', 0, ids, weekly, null);
    raise exception '두 번째 새로고침 허용';
  exception when raise_exception then if sqlerrm <> 'refresh_limit' then raise; end if; end;
  assert (select refresh_count = 1 from public.daily_recommendations where user_id = '10000000-0000-4000-8000-000000000091' and rec_date = current_date), '새로고침 상한';
  ai_rows := '[{"title":"하나","category":"walk","difficulty":1,"minutes":5,"verify_hint":"풍경","reason":"산책"},{"title":"둘","category":"walk","difficulty":1,"minutes":5,"verify_hint":"풍경","reason":"산책"},{"title":"셋","category":"walk","difficulty":1,"minutes":5,"verify_hint":"풍경","reason":"산책"},{"title":"넷","category":"walk","difficulty":1,"minutes":5,"verify_hint":"풍경","reason":"산책"}]';
  initial := public.save_recommendation('10000000-0000-4000-8000-000000000091', current_date - 1, false, 'ai-initial', -1, '{}', null, ai_rows);
  assert initial->>'source' = 'ai' and jsonb_array_length(initial->'daily') = 3, 'AI 추천 원자적 생성';
  select count(*) into before_count from public.missions where created_for = '10000000-0000-4000-8000-000000000091';
  ai_rows := jsonb_set(ai_rows, '{3,difficulty}', '"invalid"');
  begin
    perform public.save_recommendation('10000000-0000-4000-8000-000000000091', current_date - 2, false, 'bad-ai', -1, '{}', null, ai_rows);
    raise exception '잘못된 추천 허용';
  exception when invalid_text_representation then null; end;
  assert (select count(*) = before_count from public.missions where created_for = '10000000-0000-4000-8000-000000000091'), '추천 저장 실패 시 미션 롤백';
end $$;
rollback;
