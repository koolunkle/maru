-- 생성: scripts/build-seed.py (직접 수정하지 말 것)
-- 출처: 365 서울챌린지 2기 (2026.9.1 ~ 11.30) 36개 챌린지 — https://mediahub.seoul.go.kr/archives/2019234

insert into public.missions (seed_no, official_title, official_level, title, category, difficulty, minutes, verify_hint, source)
select v.*, 'seed'::public.mission_source from (values
  (1, '내 반려식물 혹은 반려동물 인증하기', 'low'::public.official_level, '반려식물이나 반려동물 사진 남기기', 'rhythm'::public.mission_category, 1, 5, '반려식물이나 반려동물'),
  (2, '내가 좋아하는 도서 필사하기', 'low'::public.official_level, '좋아하는 책 한 구절 옮겨 적기', 'growth'::public.mission_category, 2, 15, '손으로 옮겨 적은 문장'),
  (3, '우리 동네 민방위대피소 찾기', 'low'::public.official_level, '우리 동네 민방위대피소 찾아보기', 'neighborhood'::public.mission_category, 2, 15, '대피소 안내 표지판'),
  (4, '2026 서울색, 모닝옐로우(Morning Yellow) 찾기', 'low'::public.official_level, '길에서 노란색 찾아 찍기', 'walk'::public.mission_category, 1, 5, '노란색이 보이는 풍경이나 사물'),
  (5, '장바구니, 텀블러 인증하기', 'low'::public.official_level, '장바구니나 텀블러 챙겨 나가기', 'rhythm'::public.mission_category, 1, 5, '장바구니나 텀블러'),
  (6, '우리 동네 맛집 소개하기', 'low'::public.official_level, '우리 동네 맛집 한 곳 소개하기', 'food'::public.mission_category, 2, 15, '가게 외관이나 음식'),
  (7, '손목닥터 9988 1만보 인증하기', 'low'::public.official_level, '하루 1만 보 걷기', 'walk'::public.mission_category, 4, 90, '1만 보가 표시된 걸음 수 화면'),
  (8, '매달 식구일, 안부전화 인증하기(19일)', 'low'::public.official_level, '가족이나 친구에게 안부 전화하기', 'people'::public.mission_category, 1, 5, '통화 목록 화면 (번호는 가리기)'),
  (9, '오늘의 집밥(혼밥)기록하기', 'low'::public.official_level, '오늘 먹은 집밥 기록하기', 'food'::public.mission_category, 1, 5, '오늘 먹은 밥'),
  (10, '전통시장 방문하기', 'low'::public.official_level, '가까운 전통시장 들러보기', 'neighborhood'::public.mission_category, 3, 30, '시장 입구나 산 물건'),
  (11, '나의 어릴 적 사진 인증하기', 'low'::public.official_level, '어릴 적 사진 한 장 꺼내 보기', 'rhythm'::public.mission_category, 1, 5, '어릴 적 사진 (얼굴은 가려도 됨)'),
  (12, '서울 내 미술관 방문하기', 'low'::public.official_level, '서울의 미술관 한 곳 가보기', 'culture'::public.mission_category, 3, 60, '미술관 입구나 전시 안내물'),
  (13, '서울 내 박물관 방문하기', 'low'::public.official_level, '서울의 박물관 한 곳 가보기', 'culture'::public.mission_category, 3, 60, '박물관 입구나 전시 안내물'),
  (14, '서울사랑 월간지 온라인 구독 신청하기', 'mid'::public.official_level, '월간지 ''서울사랑'' 온라인 구독하기', 'growth'::public.mission_category, 1, 5, '구독 신청 완료 화면'),
  (15, '서울 하늘길 걷기', 'mid'::public.official_level, '서울 하늘길 걸어보기', 'walk'::public.mission_category, 3, 60, '하늘길 안내판이나 풍경'),
  (16, '서울 한옥마을 방문하기', 'mid'::public.official_level, '서울 한옥마을 둘러보기', 'culture'::public.mission_category, 3, 60, '한옥마을 풍경'),
  (17, '서울야외도서관 방문하기', 'mid'::public.official_level, '서울야외도서관에서 책 읽기', 'culture'::public.mission_category, 3, 60, '야외도서관 풍경이나 읽은 책'),
  (18, '서울마이소울샵 방문하기', 'mid'::public.official_level, '서울마이소울샵 들러보기', 'neighborhood'::public.mission_category, 3, 30, '매장 입구나 진열대'),
  (19, '서울시 내 궁궐 방문하기', 'mid'::public.official_level, '서울의 궁궐 한 곳 걸어보기', 'culture'::public.mission_category, 3, 60, '궁궐 풍경'),
  (20, '우리동네 플로깅하기', 'mid'::public.official_level, '동네 걸으며 쓰레기 줍기', 'walk'::public.mission_category, 3, 30, '주운 쓰레기 봉투'),
  (21, '서울둘레길2.0 방문하기', 'mid'::public.official_level, '서울둘레길 한 구간 걷기', 'walk'::public.mission_category, 4, 120, '둘레길 표지판이나 풍경'),
  (22, '서울물빛나루 방문하기', 'mid'::public.official_level, '서울물빛나루 들러보기', 'neighborhood'::public.mission_category, 3, 60, '물빛나루 풍경'),
  (23, '서울디지털동행플라자 방문하기', 'mid'::public.official_level, '서울디지털동행플라자 가보기', 'growth'::public.mission_category, 3, 60, '플라자 입구나 안내물'),
  (24, '영화·뮤지컬·연극·음악 등 서울시 내 공연 관람하기', 'mid'::public.official_level, '서울에서 공연 한 편 보기', 'culture'::public.mission_category, 4, 120, '티켓이나 공연장 입구'),
  (25, '한강해치카 탑승하기', 'mid'::public.official_level, '한강해치카 타보기', 'neighborhood'::public.mission_category, 3, 60, '해치카 외관이나 창밖 풍경'),
  (26, '서울마음편의점 방문하기', 'mid'::public.official_level, '서울마음편의점 들러 쉬어 가기', 'people'::public.mission_category, 3, 30, '편의점 입구나 내부'),
  (27, '2026년 운동하는 서울광장 참여하기', 'high'::public.official_level, '''운동하는 서울광장'' 참여하기', 'walk'::public.mission_category, 4, 60, '서울광장 운동 프로그램 현장'),
  (28, '한강페스티벌 가을 방문하기', 'high'::public.official_level, '한강페스티벌 가을 구경하기', 'culture'::public.mission_category, 4, 120, '축제 현장'),
  (29, '서울시민대학 온라인 강의듣기', 'high'::public.official_level, '서울시민대학 온라인 강의 1개 듣기', 'growth'::public.mission_category, 3, 60, '수강 완료 화면'),
  (30, '2026 서울형 책방 방문하기', 'high'::public.official_level, '서울형 책방 한 곳 가보기', 'culture'::public.mission_category, 3, 30, '책방 입구나 고른 책'),
  (31, 'K-콘텐츠 명소, 소울스팟 찾아가기', 'high'::public.official_level, 'K-콘텐츠 명소 ''소울스팟'' 찾아가기', 'culture'::public.mission_category, 3, 60, '소울스팟 안내물이나 풍경'),
  (32, '문화가 흐르는 서울광장 참여하기', 'high'::public.official_level, '''문화가 흐르는 서울광장'' 참여하기', 'culture'::public.mission_category, 4, 120, '서울광장 행사 현장'),
  (33, '서울문화의밤 ''문화로 야금야금'' 참여하기', 'high'::public.official_level, '서울문화의밤 ''문화로 야금야금'' 참여하기', 'culture'::public.mission_category, 4, 120, '행사 현장이나 안내물'),
  (34, '<서울 영테크 2.0> 프로그램 참여하기', 'high'::public.official_level, '''서울 영테크 2.0'' 프로그램 참여하기', 'growth'::public.mission_category, 4, 60, '참여 완료 화면이나 안내물'),
  (35, '｢서울 리(Re)테크｣ 재무상담 & 경제교육', 'high'::public.official_level, '''서울 리테크'' 경제교육 참여하기', 'growth'::public.mission_category, 4, 60, '참여 완료 화면이나 안내물'),
  (36, '서울국제정원박람회 방문하기', 'high'::public.official_level, '서울국제정원박람회 구경하기', 'culture'::public.mission_category, 4, 120, '정원박람회 풍경')
) as v (seed_no, official_title, official_level, title, category, difficulty, minutes, verify_hint)
on conflict (seed_no) do update set
  official_title = excluded.official_title,
  official_level = excluded.official_level,
  title = excluded.title,
  category = excluded.category,
  difficulty = excluded.difficulty,
  minutes = excluded.minutes,
  verify_hint = excluded.verify_hint;

insert into public.furniture (id, name, slot_type, unlock_rule, sort) values
  ('plant', '화분', 'window'::public.furniture_slot_type, '{"type": "first_mission"}'::jsonb, 1),
  ('lamp', '스탠드', 'desk'::public.furniture_slot_type, '{"type": "streak", "days": 3}'::jsonb, 2),
  ('sofa', '소파', 'floor'::public.furniture_slot_type, '{"type": "streak", "days": 7}'::jsonb, 3),
  ('shoe_rack', '운동화 선반', 'floor'::public.furniture_slot_type, '{"type": "category_count", "category": "walk", "count": 5}'::jsonb, 4),
  ('clock', '벽시계', 'wall'::public.furniture_slot_type, '{"type": "first_weekly"}'::jsonb, 5),
  ('poster', '전시 포스터', 'wall'::public.furniture_slot_type, '{"type": "event_mission"}'::jsonb, 6)
on conflict (id) do update set
  name = excluded.name,
  slot_type = excluded.slot_type,
  unlock_rule = excluded.unlock_rule,
  sort = excluded.sort;
