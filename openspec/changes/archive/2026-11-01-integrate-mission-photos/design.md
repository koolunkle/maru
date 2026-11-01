## 데이터 및 접근

대상 Supabase 프로젝트의 missions UUID를 참조하는 사진 경로 테이블과 비공개 Storage 버킷을 추가한다. RLS를 활성화하고 기존 사용자 정책을 유지한다. 서버 전용 사진 경로 및 읽기 권한은 서버에서만 사용하며 service_role 키를 앱에 넣지 않는다. 대상 미션 UUID와 원본 사진을 확인한 뒤 테스트 환경에 복사한다. 기존 데이터를 덮어쓰지 않는다.

## 판정 경로

verify-mission에서 인증 소유권과 진행 상태 확인 후 해당 미션의 기준 사진을 읽는다. 기준 사진이 없으면 기존 경로를 사용하고 일부라도 다운로드가 실패하면 기존 verify_fallback을 따른다. 공통 AI 호출의 다중 이미지 지원은 Gemini와 Anthropic 및 기존 호출자를 함께 검증한다. 실제 제공자 제한과 비용을 확인해 사진 개수·용량 상한을 정한다. finish_verification으로 개인정보, 멱등성, 출석·보상을 보존한다.

GeminiPicture의 text ID를 대상 UUID에 임의 변환하지 않는다. 원본 기준 사진과 힌트는 보존한다.

## 통합 결정

GeminiPicture의 비교 방식을 기존 인증 경로에 통합하며 테스트용 N서울타워·페이징 미션과 사진은 사용자 요청으로 삭제한다. 이 데이터는 Maru로 복사하지 않는다. 실제 운영 사진은 확인된 missions UUID에만 연결한다. 원본 비교 힌트는 mission_photos.hint에 별도 보존한다.

기준 사진은 미션당 최대 4장, 장당 2 MiB의 JPEG·PNG·WebP를 사용한다. Gemini·Anthropic의 다중 이미지 입력을 지원하되 비용·지연을 제한하는 애플리케이션 상한이다. 일부 누락·초과·형식 오류·다운로드 5초 초과는 전체 비교를 생략하고 verify_fallback을 따른다. 기존 제출 사진을 첫 번째, 기준 사진을 이후 순서로 보내 개인정보 판정 대상을 제출 사진으로 한정한다.

다중 이미지 형식은 [Gemini 이미지 입력 문서](https://ai.google.dev/gemini-api/docs/image-understanding)와 [Anthropic 이미지 입력 문서](https://platform.claude.com/docs/en/build-with-claude/vision)를 확인했다. 실제 사진의 정확도·지연·비용 검증은 운영 사진 등록 후 진행한다.
