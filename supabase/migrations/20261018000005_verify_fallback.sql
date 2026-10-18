-- AI 판정을 쓸 수 없을 때의 사진 인증 처리 (verify-mission)
-- 'pass': 관대한 판정 원칙대로 통과 처리 / 'retry_later': 진행 중으로 되돌리고 재시도 안내
insert into public.app_config (key, value)
values ('verify_fallback', '"pass"')
on conflict (key) do nothing;
