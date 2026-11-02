-- 기준 사진은 서버에서만 조회한다. 사용자 인증 사진과 버킷을 분리한다.
create table public.mission_photos (
  id bigint generated always as identity primary key,
  mission_id uuid not null references public.missions(id) on delete cascade,
  storage_path text not null unique,
  hint text not null default ''
);
create index mission_photos_mission_id_idx on public.mission_photos(mission_id);
alter table public.mission_photos enable row level security;
revoke all on public.mission_photos from public, anon, authenticated;
grant all on public.mission_photos to service_role;
grant usage, select on sequence public.mission_photos_id_seq to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mission-photos', 'mission-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);
