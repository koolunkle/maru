-- F15: 한국 시간으로 하루 한 개, 본인만 접근하는 기분·한 줄 기록.
create table public.daily_notes (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  note_date date not null default ((now() at time zone 'Asia/Seoul')::date),
  mood smallint not null check (mood between 1 and 5),
  text text not null default '' check (char_length(text) <= 60),
  created_at timestamptz not null default now(),
  primary key (user_id, note_date)
);

alter table public.daily_notes enable row level security;
revoke all on public.daily_notes from public, anon, authenticated;
grant select, delete on public.daily_notes to authenticated;
grant insert (user_id, mood, text) on public.daily_notes to authenticated;
grant update (mood, text) on public.daily_notes to authenticated;
grant all on public.daily_notes to service_role;
create policy "daily_notes: read own" on public.daily_notes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "daily_notes: insert own" on public.daily_notes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "daily_notes: update own" on public.daily_notes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "daily_notes: delete own" on public.daily_notes for delete to authenticated
  using (user_id = (select auth.uid()));

-- 단일 SQL로 저장·수정한다. 사용자와 날짜는 서버가 확인한다.
create function public.save_daily_note(p_user_id uuid, p_note_date date, p_mood smallint, p_text text)
returns setof public.daily_notes language sql security invoker set search_path = '' as $$
  insert into public.daily_notes (user_id, mood, text)
  select p_user_id, p_mood, p_text
  where p_user_id = (select auth.uid()) and p_note_date = (now() at time zone 'Asia/Seoul')::date
  on conflict on constraint daily_notes_pkey do update set mood = excluded.mood, text = excluded.text
  returning *;
$$;
revoke execute on function public.save_daily_note(uuid, date, smallint, text) from public, anon;
grant execute on function public.save_daily_note(uuid, date, smallint, text) to authenticated;
