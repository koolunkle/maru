alter table public.comments add column request_id text;
create unique index comments_request_uniq on public.comments(user_id, request_id) where request_id is not null;

create or replace function public.prepare_comment() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.status := 'pending';
  new.publish_at := now() + make_interval(
    mins => coalesce((select (value #>> '{}')::int from public.app_config where key = 'comment_delay_minutes'), 180)
  );
  return new;
end;
$$;

create function public.submit_comment(p_user_id uuid, p_verification_id uuid, p_body text, p_request_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved public.comments%rowtype;
begin
  if p_user_id is null or p_verification_id is null or p_body is null or char_length(p_body) not between 1 and 200
    or p_request_id is null or length(p_request_id) not between 1 and 100 then raise exception 'invalid_comment'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 4));
  select * into saved from public.comments where user_id = p_user_id and request_id = p_request_id;
  if found then
    if saved.body is distinct from p_body or saved.verification_id is distinct from p_verification_id then raise exception 'request_body_changed'; end if;
    return to_jsonb(saved);
  end if;
  if not exists (select 1 from public.verifications where id = p_verification_id and is_public and ai_result = 'pass') then
    raise exception 'invalid_verification';
  end if;
  insert into public.comments(user_id, verification_id, body, request_id)
    values (p_user_id, p_verification_id, p_body, p_request_id) returning * into saved;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.submit_comment(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_comment(uuid, uuid, text, text) to service_role;
