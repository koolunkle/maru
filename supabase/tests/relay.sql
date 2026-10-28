-- 로컬 DB에서 실행하며 테스트 데이터는 롤백한다.
begin;
grant usage on schema auth to authenticated;
insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000011'),
  ('10000000-0000-4000-8000-000000000012'),
  ('10000000-0000-4000-8000-000000000013');
insert into public.missions (id, source, title, category, difficulty, minutes, verify_hint, created_for) values
  ('20000000-0000-4000-8000-000000000011', 'seed', '같은 미션', 'walk', 1, 5, '풍경', null),
  ('20000000-0000-4000-8000-000000000012', 'seed', '다른 미션', 'walk', 1, 5, '풍경', null),
  ('20000000-0000-4000-8000-000000000013', 'seed', '다른 분야', 'food', 1, 5, '식사', null),
  ('20000000-0000-4000-8000-000000000014', 'ai', '다른 사람의 AI 미션', 'walk', 1, 5, '풍경', '10000000-0000-4000-8000-000000000011');
insert into public.user_missions (id, user_id, mission_id, type, status, due_at, completed_at) values
  ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000011', 'daily', 'completed', now(), now()),
  ('30000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000011', 'daily', 'completed', now(), now()),
  ('30000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000012', 'daily', 'completed', now(), now()),
  ('30000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000012', 'daily', 'in_progress', now(), null),
  ('30000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000013', 'daily', 'completed', now(), now());
insert into public.verifications (user_mission_id, user_id, photo_path, ai_result) values
  ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', 'test/a', 'pass'),
  ('30000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000012', 'test/b', 'privacy'),
  ('30000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000013', 'test/c', 'pass'),
  ('30000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000013', 'test/d', 'pass');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000011', true);
set local role authenticated;
insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000011', '같은 미션 응원');
do $$
begin
  assert (select status = 'pending' and category = 'walk' and publish_at > now() from public.relay_messages), '서버가 검수 대기·분류·공개 시각 설정';
  begin
    insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000011', '중복');
    raise exception '중복 작성 허용';
  exception when unique_violation then null; end;
  begin
    insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000012', '미완료');
    raise exception '미완료 작성 허용';
  exception when insufficient_privilege then null; end;
  begin
    update public.relay_messages set status = 'published';
    raise exception '상태 위조 허용';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000011', E' \t\n');
    raise exception '공백 작성 허용';
  exception when check_violation then null; end;
  begin
    insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000011', repeat('가', 61));
    raise exception '61자 작성 허용';
  exception when check_violation then null; end;
end;
$$;
reset role;
update public.relay_messages set status = 'approved', publish_at = now() - interval '1 second';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000012', true);
set local role authenticated;
insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000011', '내 글');
do $$ begin assert (select count(*) = 1 from public.relay_messages), '직접 조회는 본인만'; end $$;
reset role;
update public.relay_messages set status = 'approved', publish_at = now() + interval '1 day' where body = '내 글';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000013', true);
set local role authenticated;
insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000012', '같은 분야 응원');
insert into public.relay_messages (mission_id, body) values ('20000000-0000-4000-8000-000000000013', '다른 분야 대기');
do $$ begin assert (select category = 'food' from public.relay_messages where body = '다른 분야 대기'), '카테고리는 기본값이 아닌 실제 미션 기준'; end $$;
reset role;
update public.relay_messages set status = 'approved', publish_at = now() - interval '1 second' where body = '같은 분야 응원';
insert into public.comments (verification_id, body)
  select id, '기존 댓글' from public.verifications where user_mission_id = '30000000-0000-4000-8000-000000000011';
update public.comments set status = 'approved', publish_at = now() - interval '1 second' where body = '기존 댓글';

do $$
begin
  assert public.publish_due_comments() = 3, '공개 시점이 지난 기존 댓글과 릴레이만 공개';
  assert (select status = 'published' from public.comments where body = '기존 댓글'), '기존 댓글 공개 유지';
  assert (select status = 'approved' from public.relay_messages where body = '내 글'), '공개 시점 전에는 공개하지 않음';
end $$;
update public.relay_messages set status = 'published' where body = '내 글';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000012', true);
set local role authenticated;
do $$
declare messages text[];
begin
  select array_agg(body) into messages from public.get_relay_messages('20000000-0000-4000-8000-000000000011');
  assert messages = array['같은 미션 응원', '같은 분야 응원'], '같은 미션 우선·같은 분야 보충·본인 글 제외';
  assert not exists (select 1 from public.get_relay_messages('20000000-0000-4000-8000-000000000013')), '다른 분야 제외';
  assert not exists (select 1 from public.get_relay_messages('20000000-0000-4000-8000-000000000014')), '타인의 AI 미션 접근 차단';
end $$;
reset role;
update public.relay_messages set created_at = now() - interval '8 days' where body = '같은 분야 응원';
update public.relay_messages set created_at = now() - interval '8 days' where body = '같은 미션 응원';
set local role authenticated;
do $$
begin
  assert not exists (select 1 from public.get_relay_messages('20000000-0000-4000-8000-000000000011') where body = '같은 분야 응원'), '7일이 지난 다른 미션 글 제외';
  assert exists (select 1 from public.get_relay_messages('20000000-0000-4000-8000-000000000011') where body = '같은 미션 응원'), '같은 미션은 7일이 지나도 표시';
end $$;
reset role;
rollback;
