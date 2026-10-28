-- 마음 우체통: 새 글은 수신자마다 KST 하루 1개까지 배정한다.
-- 안 읽은 글이 없을 때마다 배정하면 한 사람이 우체통을 여러 번 열어 대기 글을 모두 가져간다(#46).
create or replace function public.receive_mailbox_message(recipient uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  message_id uuid;
begin
  -- 같은 수신자의 동시 조회를 직렬화한다. 다른 수신자는 잠기지 않은 글을 가져간다.
  perform 1 from public.profiles where id = recipient for update;
  if not found then raise exception 'recipient_not_found'; end if;
  if exists (
    select 1 from public.mailbox_messages
    where recipient_id = recipient
      and (read_at is null or received_at >= (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'))
  ) then return; end if;

  select id into message_id from public.mailbox_messages
  where status = 'approved' and user_id <> recipient
  order by created_at, id
  limit 1 for update skip locked;

  if message_id is not null then
    update public.mailbox_messages
    set recipient_id = recipient, received_at = now(), status = 'published'
    where id = message_id;
  end if;
end;
$$;
revoke all on function public.receive_mailbox_message(uuid) from public, anon, authenticated;
grant execute on function public.receive_mailbox_message(uuid) to service_role;
