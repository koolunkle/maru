-- F14: 검수된 한 줄을 한 사람에게만 배정한다. 클라이언트는 Edge Function만 사용한다.
create table public.mailbox_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_id text not null check (char_length(request_id) between 16 and 80),
  body text not null check (char_length(btrim(body, E' \t\n\r')) between 1 and 60),
  status public.comment_status not null default 'pending',
  recipient_id uuid references public.profiles (id) on delete cascade,
  received_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, request_id),
  check (recipient_id is null or recipient_id <> user_id),
  check ((status = 'published') = (recipient_id is not null)),
  check ((recipient_id is null) = (received_at is null)),
  check (read_at is null or received_at is not null)
);
create index mailbox_queue_idx on public.mailbox_messages (created_at, id) where status = 'approved';
create index mailbox_inbox_idx on public.mailbox_messages (recipient_id, received_at desc);
create index mailbox_sent_idx on public.mailbox_messages (user_id, created_at desc);
alter table public.mailbox_messages enable row level security;
revoke all on public.mailbox_messages from public, anon, authenticated;
grant all on public.mailbox_messages to service_role;

create function public.receive_mailbox_message(recipient uuid)
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
    select 1 from public.mailbox_messages where recipient_id = recipient and read_at is null
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
