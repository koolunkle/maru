-- 외래 키 인덱스 (performance advisor: unindexed_foreign_keys)
create index comments_user_id_idx on public.comments (user_id);
create index daily_recommendations_weekly_mission_id_idx on public.daily_recommendations (weekly_mission_id);
create index mission_participants_user_id_idx on public.mission_participants (user_id);
create index missions_created_for_idx on public.missions (created_for);
create index missions_event_id_idx on public.missions (event_id);
create index reactions_user_id_idx on public.reactions (user_id);
create index user_furniture_furniture_id_idx on public.user_furniture (furniture_id);
create index user_missions_mission_id_idx on public.user_missions (mission_id);
create index verifications_user_id_idx on public.verifications (user_id);
