-- 민수 데모 계정에 "어제까지 7일" 기록을 만든다 (tasks 1.1).
-- 다시 실행해도 된다: 그 계정의 미션·인증·기록·가구를 지우고 실행한 날 기준으로 다시 만든다.
--
-- 준비
--   1. 시연에 쓸 브라우저에서 운영 URL로 온보딩한다. 관심사에 '산책·운동'을 넣는다.
--      설정 화면의 닉네임(자동으로 정해진다)으로 사용자 id를 찾아 아래 demo_user에 넣는다.
--      select id, onboarded_at from public.profiles where nickname = '설정에 보이는 닉네임' order by onboarded_at desc;
--   2. 사진 7장을 Storage verifications 버킷의 <사용자 id>/demo-1.jpg ~ demo-7.jpg로 올린다 (README.md).
-- 실행: Supabase SQL Editor 또는 MCP execute_sql에 이 파일 전체를 넣는다. 하나의 트랜잭션이다.
--
-- 규칙은 finish_verification(출석·가구)과 adjust_difficulty(3회 연속 완료마다 난이도 +1)를 따른다.

do $demo$
declare
  demo_user constant uuid := '00000000-0000-0000-0000-000000000000';
  start_difficulty constant int := 1;
  -- 일차별 (시드 번호, 소감). 1일차가 7일 전, 7일차가 어제다.
  plan constant jsonb := '[
    {"seed": 4,  "note": "출근길에 노란 우산이 눈에 띄었어요"},
    {"seed": 9,  "note": "오랜만에 밥을 지어 먹었어요"},
    {"seed": 5,  "note": "텀블러 챙기는 걸 잊지 않았어요"},
    {"seed": 2,  "note": "좋아하는 문장을 다시 적어 봤어요"},
    {"seed": 1,  "note": "화분에 물을 줬어요"},
    {"seed": 20, "note": "동네 한 바퀴 돌며 조금 주웠어요"},
    {"seed": 4,  "note": "노란 은행잎이 많이 떨어져 있었어요"}
  ]';
  -- 일차별 한 줄 기록 (기분 1~3만 쓴다. 4~5는 리포트에 도움 안내가 뜬다)
  notes constant jsonb := '[
    {"mood": 3, "text": "그냥 보통인 하루"},
    {"mood": 3, "text": "밥을 챙겨 먹으니 조금 나았다"},
    {"mood": 2, "text": "사흘째 이어 가고 있다"},
    {"mood": 3, "text": ""},
    {"mood": 2, "text": "화분이 조금 자란 것 같다"},
    {"mood": 2, "text": "밖에 나가니 기분이 괜찮았다"},
    {"mood": 1, "text": "일주일을 채웠다"}
  ]';
  today date := (now() at time zone 'Asia/Seoul')::date;
  uid uuid;
  day date;
  done_at timestamptz;
  mission public.missions%rowtype;
  um_id uuid;
  photo text;
  completed int := 0;
  level int := start_difficulty;
  changed_at timestamptz;
  walk_count int := 0;
  sofa_at timestamptz;
  lamp_at timestamptz;
  plant_at timestamptz;
begin
  select id into strict uid from public.profiles where id = demo_user and onboarded_at is not null;

  for i in 1..7 loop
    photo := uid || '/demo-' || i || '.jpg';
    if not exists (select 1 from storage.objects where bucket_id = 'verifications' and name = photo) then
      raise exception '사진이 없습니다: verifications/%', photo;
    end if;
  end loop;

  -- 지난 실행·리허설 기록 지우기 (프로필과 사진 파일은 남긴다)
  delete from public.relay_messages where user_id = uid;
  delete from public.mission_participants where user_id = uid;
  delete from public.verification_responses where verification_id in (select id from public.verifications where user_id = uid);
  delete from public.verifications where user_id = uid;
  delete from public.user_missions where user_id = uid;
  delete from public.daily_recommendations where user_id = uid;
  delete from public.recommendation_requests where user_id = uid;
  delete from public.daily_notes where user_id = uid;
  delete from public.weekly_letters where user_id = uid;
  delete from public.user_furniture where user_id = uid;

  for i in 1..7 loop
    day := today - (8 - i);
    -- 그날 저녁 8시(KST)쯤 완료한 것으로 둔다
    done_at := (day + time '20:00' + make_interval(mins => i * 7)) at time zone 'Asia/Seoul';
    select * into strict mission from public.missions where source = 'seed' and seed_no = (plan -> (i - 1) ->> 'seed')::int;
    if mission.difficulty > level + 1 then
      raise exception '%일차 미션 난이도 %가 그때 프로필 난이도 %+1을 넘습니다', i, mission.difficulty, level;
    end if;

    insert into public.user_missions(user_id, mission_id, type, status, started_at, due_at, completed_at, resolved_at)
    values (uid, mission.id, 'daily', 'completed', done_at - interval '10 minutes',
            ((day + 1)::timestamp at time zone 'Asia/Seoul') - interval '1 millisecond', done_at, done_at)
    returning id into um_id;
    insert into public.verifications(user_mission_id, user_id, photo_path, text, ai_result, ai_message, is_public, created_at)
    values (um_id, uid, uid || '/demo-' || i || '.jpg', plan -> (i - 1) ->> 'note', 'pass',
            '오늘의 미션을 해냈어요', false, done_at - interval '1 minute');
    insert into public.daily_notes(user_id, note_date, mood, text, created_at)
    values (uid, day, (notes -> (i - 1) ->> 'mood')::smallint, notes -> (i - 1) ->> 'text', done_at + interval '30 minutes');

    completed := completed + 1;
    if mission.category = 'walk' then walk_count := walk_count + 1; end if;
    if completed % 3 = 0 then
      level := least(5, level + 1);
      changed_at := done_at;
    end if;
    if i = 1 then plant_at := done_at; end if;
    if i = 3 then lamp_at := done_at; end if;
    if i = 7 then sofa_at := done_at; end if;
  end loop;

  -- 출석: 어제까지 7일 연속
  update public.profiles
  set streak = 7, last_attended = today - 1, rest_used_week = null,
      difficulty = level, difficulty_changed_at = changed_at
  where id = uid;

  -- 가구: 첫 미션(화분), 3일 연속(스탠드), 7일 연속(소파). 놓는 건 시연에서 직접 한다
  insert into public.user_furniture(user_id, furniture_id, slot, acquired_at) values
    (uid, 'plant', null, plant_at), (uid, 'lamp', null, lamp_at), (uid, 'sofa', null, sofa_at);
  if walk_count >= 5 then
    raise exception '산책 %회면 운동화 선반을 줘야 합니다. plan을 확인하세요', walk_count;
  end if;

  raise notice '완료: %, 출석 7일, 난이도 %, 산책 %회, 가구 3개', uid, level, walk_count;
end
$demo$;
