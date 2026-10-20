-- 맞춤형 서울챌린지 초기 스키마 (PRD §6.1)

create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- enum
-- ---------------------------------------------------------------------------
create type public.mission_category as enum ('walk', 'food', 'culture', 'growth', 'neighborhood', 'rhythm', 'people');
create type public.mission_source as enum ('seed', 'ai', 'event');
create type public.official_level as enum ('low', 'mid', 'high');
create type public.mission_type as enum ('daily', 'weekly');
create type public.user_mission_status as enum ('in_progress', 'judging', 'completed', 'expired');
create type public.verification_result as enum ('pass', 'retry', 'privacy');
create type public.comment_status as enum ('pending', 'approved', 'rejected', 'crisis', 'published');
create type public.reaction_type as enum ('cheer', 'metoo', 'nice');
create type public.furniture_slot_type as enum ('floor', 'wall', 'window', 'desk');
create type public.room_slot as enum ('floor-1', 'floor-2', 'wall-1', 'wall-2', 'window', 'desk');

-- ---------------------------------------------------------------------------
-- 설정
-- ---------------------------------------------------------------------------
create table public.app_config (
  key text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------------------
-- 사용자
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 12),
  categories public.mission_category[] not null default '{}' check (cardinality(categories) <= 3),
  district text,
  daily_minutes int check (daily_minutes in (5, 15, 30)),
  difficulty int not null default 1 check (difficulty between 1 and 5),
  preferences jsonb not null default '{}',
  streak int not null default 0 check (streak >= 0),
  last_attended date,
  rest_used_week date,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 미션
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  district text not null,
  title text not null,
  place text,
  url text,
  start_date date not null,
  end_date date not null
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  source public.mission_source not null,
  seed_no int unique,
  official_title text,
  official_level public.official_level,
  title text not null check (char_length(title) <= 40),
  category public.mission_category not null,
  difficulty int not null check (difficulty between 1 and 5),
  minutes int not null check (minutes > 0),
  verify_hint text not null check (char_length(verify_hint) <= 30),
  reason text check (char_length(reason) <= 50),
  event_id uuid references public.events (id) on delete set null,
  created_for uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((source = 'ai') = (created_for is not null))
);

-- F2 추천 결과 캐시: (user_id, KST 날짜)당 1행
create table public.daily_recommendations (
  user_id uuid not null references public.profiles (id) on delete cascade,
  rec_date date not null,
  daily_mission_ids uuid[] not null,
  weekly_mission_id uuid references public.missions (id) on delete set null,
  refresh_count int not null default 0 check (refresh_count between 0 and 1),
  created_at timestamptz not null default now(),
  primary key (user_id, rec_date)
);

create table public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  mission_id uuid not null references public.missions (id) on delete cascade,
  type public.mission_type not null,
  status public.user_mission_status not null default 'in_progress',
  due_at timestamptz not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index user_missions_user_status_idx on public.user_missions (user_id, status);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_mission_id uuid not null references public.user_missions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  photo_path text not null,
  text text check (char_length(text) <= 100),
  ai_result public.verification_result,
  ai_message text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index verifications_user_mission_idx on public.verifications (user_mission_id);
create index verifications_feed_idx on public.verifications (created_at desc) where is_public and ai_result = 'pass';

-- ---------------------------------------------------------------------------
-- 커뮤니티
-- ---------------------------------------------------------------------------
create table public.mission_participants (
  mission_id uuid not null references public.missions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mission_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.verifications (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 200),
  status public.comment_status not null default 'pending',
  publish_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index comments_verification_idx on public.comments (verification_id);
create index comments_publish_due_idx on public.comments (publish_at) where status = 'approved';

create table public.reactions (
  verification_id uuid not null references public.verifications (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (verification_id, user_id, type)
);

-- ---------------------------------------------------------------------------
-- 보상
-- ---------------------------------------------------------------------------
create table public.furniture (
  id text primary key,
  name text not null,
  slot_type public.furniture_slot_type not null,
  unlock_rule jsonb not null,
  sort int not null
);

create table public.user_furniture (
  user_id uuid not null references public.profiles (id) on delete cascade,
  furniture_id text not null references public.furniture (id) on delete cascade,
  slot public.room_slot,
  acquired_at timestamptz not null default now(),
  primary key (user_id, furniture_id)
);
create unique index user_furniture_slot_uniq on public.user_furniture (user_id, slot) where slot is not null;

-- ---------------------------------------------------------------------------
-- 트리거 함수
-- ---------------------------------------------------------------------------

-- 가입 시 프로필 + 닉네임 자동 생성 (PRD F1)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  adjectives text[] := array['느긋한','산책하는','성실한','조용한','씩씩한','다정한','부지런한','호기심많은','졸린','배고픈',
                             '반짝이는','수줍은','용감한','차분한','명랑한','꼼꼼한','엉뚱한','포근한','단단한','느릿한'];
  animals text[] := array['고양이','강아지','수달','다람쥐','펭귄','거북이','고래','여우','너구리','토끼',
                          '부엉이','사슴','판다','오리','해달','알파카','고슴도치','참새','곰','햄스터'];
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    adjectives[1 + floor(random() * array_length(adjectives, 1))::int] || ' ' ||
    animals[1 + floor(random() * array_length(animals, 1))::int]
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 댓글 작성 시 상태·공개 시각을 서버에서 강제 (PRD F6)
create function public.prepare_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := auth.uid();
  new.status := 'pending';
  new.publish_at := now() + make_interval(
    mins => coalesce((select (value #>> '{}')::int from public.app_config where key = 'comment_delay_minutes'), 180)
  );
  return new;
end;
$$;

create trigger comments_before_insert
  before insert on public.comments
  for each row execute function public.prepare_comment();

-- 가구는 맞는 slot_type의 슬롯에만 배치 (PRD F7)
create function public.check_furniture_slot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  t public.furniture_slot_type;
begin
  if new.slot is null then
    return new;
  end if;
  select slot_type into t from public.furniture where id = new.furniture_id;
  if split_part(new.slot::text, '-', 1) <> t::text then
    raise exception 'furniture % cannot be placed in slot %', new.furniture_id, new.slot;
  end if;
  return new;
end;
$$;

create trigger user_furniture_check_slot
  before insert or update of slot on public.user_furniture
  for each row execute function public.check_furniture_slot();

-- ---------------------------------------------------------------------------
-- RPC
-- ---------------------------------------------------------------------------

-- 피드·참여자 표시용 닉네임 조회 (profiles 전체 노출 없이)
create function public.get_nicknames(user_ids uuid[])
returns table (id uuid, nickname text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nickname from public.profiles p where p.id = any (user_ids);
$$;

-- 미션별 '같이 할래요' 인원 (PRD F9)
create function public.get_participant_counts(mission_ids uuid[])
returns table (mission_id uuid, count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select mp.mission_id, count(*) from public.mission_participants mp
  where mp.mission_id = any (mission_ids)
  group by mp.mission_id;
$$;

-- 공개 시각이 지난 승인 댓글 공개 (pg_cron)
create function public.publish_due_comments()
returns int
language sql
security definer
set search_path = ''
as $$
  with updated as (
    update public.comments set status = 'published'
    where status = 'approved' and publish_at <= now()
    returning 1
  )
  select count(*)::int from updated;
$$;

-- 기한 지난 미션 만료 (pg_cron)
create function public.expire_due_missions()
returns int
language sql
security definer
set search_path = ''
as $$
  with updated as (
    update public.user_missions set status = 'expired'
    where status = 'in_progress' and due_at < now()
    returning 1
  )
  select count(*)::int from updated;
$$;

-- 시연 모드 전환: 댓글 공개 지연 1분 + cron 매분 / 운영: 180분 + 10분 주기 (PRD F6)
create function public.set_demo_mode(enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_config (key, value)
  values ('comment_delay_minutes', to_jsonb(case when enabled then 1 else 180 end))
  on conflict (key) do update set value = excluded.value;

  perform cron.schedule('publish-due-comments', case when enabled then '* * * * *' else '*/10 * * * *' end,
                        'select public.publish_due_comments()');
end;
$$;

revoke execute on function public.publish_due_comments() from public, anon, authenticated;
revoke execute on function public.expire_due_missions() from public, anon, authenticated;
revoke execute on function public.set_demo_mode(boolean) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prepare_comment() from public, anon, authenticated;
revoke execute on function public.get_nicknames(uuid[]) from public, anon;
revoke execute on function public.get_participant_counts(uuid[]) from public, anon;
grant execute on function public.get_nicknames(uuid[]) to authenticated;
grant execute on function public.get_participant_counts(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.missions enable row level security;
alter table public.daily_recommendations enable row level security;
alter table public.user_missions enable row level security;
alter table public.verifications enable row level security;
alter table public.mission_participants enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.furniture enable row level security;
alter table public.user_furniture enable row level security;

-- 읽기 전용 공용 데이터
create policy "app_config: read" on public.app_config for select to authenticated using (true);
create policy "events: read" on public.events for select to authenticated using (true);
create policy "furniture: read" on public.furniture for select to authenticated using (true);
create policy "missions: read seed/event or own ai" on public.missions for select to authenticated
  using (source <> 'ai' or created_for = (select auth.uid()));

-- profiles: 본인만. 수정 가능 컬럼 제한(streak·difficulty는 서버만)
create policy "profiles: read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated, anon;
grant update (nickname, categories, district, daily_minutes, onboarded_at) on public.profiles to authenticated;

-- 추천 캐시: 본인 읽기만 (쓰기는 Edge Function)
create policy "daily_recommendations: read own" on public.daily_recommendations for select to authenticated
  using (user_id = (select auth.uid()));

-- user_missions: 본인 읽기 + 시작(in_progress)만 생성. 상태 변경은 서버
create policy "user_missions: read own" on public.user_missions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "user_missions: start own" on public.user_missions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'in_progress' and completed_at is null);

-- verifications: 본인 + 공개 통과건 읽기, 본인 생성, 공개 여부만 수정(privacy 판정 제외)
create policy "verifications: read own or public" on public.verifications for select to authenticated
  using (user_id = (select auth.uid()) or (is_public and ai_result = 'pass'));
create policy "verifications: create own" on public.verifications for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and ai_result is null
    and exists (select 1 from public.user_missions um where um.id = user_mission_id and um.user_id = (select auth.uid()))
  );
create policy "verifications: toggle public own" on public.verifications for update to authenticated
  using (user_id = (select auth.uid()) and ai_result is distinct from 'privacy')
  with check (user_id = (select auth.uid()));
revoke update on public.verifications from authenticated, anon;
grant update (is_public) on public.verifications to authenticated;

-- 같이 할래요
create policy "mission_participants: read own" on public.mission_participants for select to authenticated
  using (user_id = (select auth.uid()));
create policy "mission_participants: join" on public.mission_participants for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "mission_participants: leave" on public.mission_participants for delete to authenticated
  using (user_id = (select auth.uid()));

-- 댓글: 본인 것 + 공개된 것 읽기, 공개 인증에만 작성
create policy "comments: read own or published" on public.comments for select to authenticated
  using (user_id = (select auth.uid()) or status = 'published');
create policy "comments: create on public verification" on public.comments for insert to authenticated
  with check (exists (
    select 1 from public.verifications v where v.id = verification_id and v.is_public and v.ai_result = 'pass'
  ));
revoke insert on public.comments from authenticated, anon;
grant insert (verification_id, body) on public.comments to authenticated;

-- 빠른 반응
create policy "reactions: read" on public.reactions for select to authenticated using (true);
create policy "reactions: add own" on public.reactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "reactions: remove own" on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- 가구: 본인 읽기, 배치(slot)만 수정. 획득은 서버
create policy "user_furniture: read own" on public.user_furniture for select to authenticated
  using (user_id = (select auth.uid()));
create policy "user_furniture: place own" on public.user_furniture for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.user_furniture from authenticated, anon;
grant update (slot) on public.user_furniture to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: 인증 사진 (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verifications', 'verifications', false, 5242880, array['image/jpeg']);

create policy "verifications bucket: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "verifications bucket: read own or public" on storage.objects for select to authenticated
  using (
    bucket_id = 'verifications'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.verifications v where v.photo_path = name and v.is_public and v.ai_result = 'pass')
    )
  );

-- ---------------------------------------------------------------------------
-- 예약 작업
-- ---------------------------------------------------------------------------
select cron.schedule('expire-due-missions', '*/10 * * * *', 'select public.expire_due_missions()');
select public.set_demo_mode(false);
