## Why

docs/PRODUCT.md 1.2절 문제 4의 장소 미션에 기준 사진과 운영 기간을 등록할 관리 화면이 필요하다. 기존 GeminiPicture 관리자 기능을 현재 Maru DB에 연결해 외부 웹에서도 운영할 수 있게 한다.

## What Changes

- 사용자 요청에 따라 이메일 계정 없이 관리자 비밀번호로 관리 화면에 접근한다.
- 미션 검색·페이지 조회·등록·수정, 추천 시작일·종료일 설정을 제공한다.
- 미션별 기준 사진과 비교 힌트의 등록·목록·삭제를 제공한다. 최대 4장·장당 2 MiB를 지킨다.
- 서버에서 모든 요청의 권한을 검사하고 반복된 비밀번호 입력을 제한한다. 기존 사용자 기록이 연결된 미션은 삭제하지 않는다.

하지 않는 것: 실제 사진 품질 검증, 관리자 계정 체계, 사용자 기록 삭제, 운영 웹의 자동 배포·자동 병합.

## Capabilities

### New Capabilities

- admin-mission-management: 관리자 비밀번호를 사용하는 외부 웹 미션·사진 관리.

### Modified Capabilities

없음. 기존 추천·인증 정책은 유지한다.

## Impact

- 서버 전용 로그인 시도 제한을 위한 테이블·RPC와 RLS 마이그레이션 및 DB 타입 재생성이 필요하다.
- 새 admin-missions Edge Function과 서버 시크릿 ADMIN_PASSWORD가 필요하다. 앱 번들에는 비밀번호·service_role 키를 넣지 않는다.
- /admin 라우트와 화면, DESIGN.md 및 docs/ARCHITECTURE.md를 갱신한다.
- app_config 변경 없음. 기존 DB·함수 운영 배포는 신규 변경 검증과 리뷰 절차를 따른다.
