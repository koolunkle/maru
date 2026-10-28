-- F10: 완료한 미션에 남긴 글만 검수 후 릴레이에 공개한다.
create table public.relay_messages (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  category public.mission_category not null default 'walk',
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body, E' \t\n\r')) between 1 and 60),
  status public.comment_status not null default 'pending',
  publish_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (mission_id, user_id)
);
create index relay_mission_published_idx on public.relay_messages (mission_id, created_at desc) where status = 'published';
create index relay_category_published_idx on public.relay_messages (category, created_at desc) where status = 'published';
create index relay_publish_due_idx on public.relay_messages (publish_at) where status = 'approved';

create function public.prepare_relay_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.user_id := auth.uid();
  if not exists (
    select 1 from public.user_missions um
    join public.verifications v on v.user_mission_id = um.id and v.user_id = um.user_id
    where um.user_id = new.user_id and um.mission_id = new.mission_id
      and um.status = 'completed' and v.ai_result in ('pass', 'privacy')
  ) then
    raise exception 'mission_not_completed' using errcode = '42501';
  end if;
  select category into strict new.category from public.missions where id = new.mission_id;
  new.status := 'pending';
  new.publish_at := now() + make_interval(
    mins => coalesce((select (value #>> '{}')::int from public.app_config where key = 'comment_delay_minutes'), 180)
  );
  return new;
end;
$$;
create trigger relay_messages_before_insert before insert on public.relay_messages
  for each row execute function public.prepare_relay_message();
revoke execute on function public.prepare_relay_message() from public, anon, authenticated;

alter table public.relay_messages enable row level security;
revoke all on public.relay_messages from public, anon, authenticated;
grant select on public.relay_messages to authenticated;
grant insert (mission_id, body) on public.relay_messages to authenticated;
grant all on public.relay_messages to service_role;
create policy "relay_messages: read own" on public.relay_messages for select to authenticated
  using (user_id = (select auth.uid()));
create policy "relay_messages: create own" on public.relay_messages for insert to authenticated
  with check (user_id = (select auth.uid()));

create function public.get_relay_messages(mission uuid)
returns table (body text) language sql stable security definer set search_path = '' as $$
  with target as (
    select m.id, m.category from public.missions m
    where m.id = mission and (m.source <> 'ai' or m.created_for = (select auth.uid()))
  )
  select r.body from public.relay_messages r join target t on true
  where r.status = 'published' and r.user_id <> (select auth.uid())
    and (r.mission_id = t.id or (r.category = t.category and r.created_at >= now() - interval '7 days'))
  order by (r.mission_id = t.id) desc, r.created_at desc, r.id desc
  limit 3;
$$;
revoke execute on function public.get_relay_messages(uuid) from public, anon;
grant execute on function public.get_relay_messages(uuid) to authenticated;

create or replace function public.publish_due_comments()
returns int language sql security definer set search_path = '' as $$
  with comments_updated as (
    update public.comments set status = 'published'
    where status = 'approved' and publish_at <= now() returning 1
  ), relay_updated as (
    update public.relay_messages set status = 'published'
    where status = 'approved' and publish_at <= now() returning 1
  )
  select ((select count(*) from comments_updated) + (select count(*) from relay_updated))::int;
$$;
