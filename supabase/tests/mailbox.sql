-- 로컬 DB에서 실행. 모든 테스트 데이터는 롤백한다.
begin;
insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003');

do $$
declare
  a uuid := '10000000-0000-4000-8000-000000000001';
  b uuid := '10000000-0000-4000-8000-000000000002';
  c uuid := '10000000-0000-4000-8000-000000000003';
begin
  insert into public.mailbox_messages (user_id, request_id, body, status) values
    (a, 'test-approved-0001', '오늘도 응원해요', 'approved'),
    (a, 'test-pending-00001', '아직 검수 중이에요', 'pending'),
    (a, 'test-rejected-0001', '전달하지 않는 글', 'rejected'),
    (a, 'test-crisis-000001', '비공개 글', 'crisis');
  perform public.receive_mailbox_message(a);
  assert not exists (select 1 from public.mailbox_messages where recipient_id = a), '본인 글 수신 금지';
  perform public.receive_mailbox_message(b);
  assert (select count(*) = 1 from public.mailbox_messages where recipient_id = b and status = 'published'), '승인된 글 수신';
  assert not exists (select 1 from public.mailbox_messages where status in ('pending','rejected','crisis') and recipient_id is not null), '미검수·비공개 글 차단';
  perform public.receive_mailbox_message(c);
  assert not exists (select 1 from public.mailbox_messages where recipient_id = c), '같은 글을 다른 수신자에게 재배정하지 않음';
  insert into public.mailbox_messages (user_id, request_id, body, status)
  values (a, 'test-approved-0002', '다음 한 줄', 'approved');
  perform public.receive_mailbox_message(b);
  assert (select count(*) = 1 from public.mailbox_messages where recipient_id = b), '안 읽은 글이 있으면 추가 배정하지 않음';
  update public.mailbox_messages set read_at = now() where recipient_id = b;
  perform public.receive_mailbox_message(b);
  assert (select count(*) = 2 from public.mailbox_messages where recipient_id = b), '읽은 글 보존 및 다음 글 수신';
  insert into public.mailbox_messages (user_id, request_id, body)
  values (a, 'test-approved-0001', '오늘도 응원해요') on conflict (user_id, request_id) do nothing;
  assert (select count(*) = 1 from public.mailbox_messages where request_id = 'test-approved-0001'), '재시도 중복 저장 금지';
  begin
    insert into public.mailbox_messages (user_id, request_id, body) values (a, 'test-empty-000001', E' \t\n');
    raise exception '공백 입력이 허용됨';
  exception when check_violation then null; end;
  begin
    insert into public.mailbox_messages (user_id, request_id, body) values (a, 'test-length-00001', repeat('가', 61));
    raise exception '61자 입력이 허용됨';
  exception when check_violation then null; end;
end;
$$;
set local role authenticated;
do $$
begin
  begin
    perform * from public.mailbox_messages;
    raise exception '클라이언트 직접 조회가 허용됨';
  exception when insufficient_privilege then null; end;
  begin
    update public.mailbox_messages set status = 'approved';
    raise exception '클라이언트 상태 위조가 허용됨';
  exception when insufficient_privilege then null; end;
  begin
    perform public.receive_mailbox_message('10000000-0000-4000-8000-000000000003');
    raise exception '클라이언트 타인 배정이 허용됨';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
rollback;
