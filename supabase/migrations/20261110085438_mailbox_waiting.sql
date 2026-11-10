-- 마음 우체통 탭 점: 배정 없이 "읽을 한 줄이 있거나 열면 새 한 줄을 받을 수 있는지"만 본다.
-- 하루 경계와 받을 글 조건은 receive_mailbox_message(20261029100000_mailbox_daily_receive)와 같다.
create or replace function public.mailbox_waiting(recipient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1 from public.mailbox_messages
      where recipient_id = recipient and status = 'published' and read_at is null
    )
    or (
      not exists (
        select 1 from public.mailbox_messages
        where recipient_id = recipient
          and received_at >= (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')
      )
      and exists (
        select 1 from public.mailbox_messages
        where status = 'approved' and user_id <> recipient
      )
    );
$$;
revoke all on function public.mailbox_waiting(uuid) from public, anon, authenticated;
grant execute on function public.mailbox_waiting(uuid) to service_role;
