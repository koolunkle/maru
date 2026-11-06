# Proposal

## Why

미션 상세는 인증 힌트 뒤에 항상 " 사진 한 장"을 붙인다. 힌트는 "사진에 담을 대상"(명사구)이어야 하는데, 관리자 화면의 입력란에는 그 안내가 없어 "4층 입구 바로 앞에 조형물있습니다 사진 한 장" 같은 문장이 나왔다.

## What Changes

- 관리자 화면의 인증 힌트 입력란 이름에 "(사진에 담을 대상)"을 붙이고 예시 placeholder("예: 4층 입구 앞 조형물")를 보여 준다.
- 입력하는 동안 사용자에게 보일 문장("… 사진 한 장")을 입력란 아래에 미리 보여 준다.

하지 않는 것:
- 미션 상세의 " 사진 한 장" 붙이기와 힌트 30자 제한은 바꾸지 않는다.
- 이미 등록된 미션의 힌트는 이 change에서 고치지 않는다(관리자 화면에서 고친다).

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `admin-mission-management`: 인증 힌트 입력 안내와 미리보기.

## Impact

- 코드: `src/screens/admin.tsx` 인증 힌트 입력란.
- DB 마이그레이션·Edge Function·app_config 변경 없음. 웹 운영 반영(`eas deploy --prod`)만 필요하다.
