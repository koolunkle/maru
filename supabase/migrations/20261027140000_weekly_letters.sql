-- F13: 편지는 서버만 작성하고 본인만 읽는다.
create table public.weekly_letters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  body text not null,
  source text not null check (source in ('ai', 'rule')),
  input_hash text not null,
  finalized boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.weekly_letters enable row level security;
revoke all on public.weekly_letters from public, anon, authenticated;
grant select on public.weekly_letters to authenticated;
grant all on public.weekly_letters to service_role;
create policy "weekly_letters: read own" on public.weekly_letters for select to authenticated
  using (user_id = (select auth.uid()));
