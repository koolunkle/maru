-- 같은 업로드 경로의 인증 행은 한 번만 생성한다.
create unique index verifications_user_photo_uniq on public.verifications(user_id, photo_path);
