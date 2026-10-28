-- 문화행사 동기화: 매일 05:00 KST(20:00 UTC)에 sync-events 함수를 호출한다.
-- 호출 주소·키·비밀값은 Vault에 둔다(project_url, publishable_key, sync_events_secret). 값은 이 파일에 넣지 않는다. docs/ENV.md C절.
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'sync-events',
  '0 20 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key'),
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_events_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
