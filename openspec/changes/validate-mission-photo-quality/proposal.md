## Why

docs/PRODUCT.md 1.2절 문제 4에 대응하는 장소 미션 인증의 실제 판정 품질을 확인한다. 사용자가 사진 등록과 해당 검증을 나중에 진행하기로 하여, 구현된 integrate-mission-photos의 보류 검증을 별도 후속 작업으로 유지한다.

## What Changes

- 같은 장소·다른 장소, 다른 조명·각도 및 개인정보가 보이는 사진으로 판정 정확도·지연·비용을 기록한다.
- 실제 제공자 환경의 20초 시간 초과와 개인정보 판정부터 비공개 저장까지의 흐름을 확인한다.
- 사진 제출·결과 화면과 Expo Go 실기기를 확인하고 임시 데이터를 정리한다.

하지 않는 것: 앱 동작 변경, 관리자 페이지 구현, 새 마이그레이션 및 함수 배포. 결함이 발견되면 해당 기준 spec에 따라 별도로 수정한다.

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

없음. 검증 작업만 수행하므로 skip_specs를 사용한다.

## Impact

- 사진 등록 이후에 착수한다. 사진과 장소의 대응을 확인하고 현재 Maru DB에 운영 또는 임시 검증 자료로 등록한다.
- 기존 검증 증거는 openspec/changes/archive/2026-11-01-integrate-mission-photos/verification.md에 있다. 실제 사진 품질과 실기기 검증은 아직 통과하지 않았다.
- DB 마이그레이션·Edge Function 재배포·app_config 변경 없음. 운영 공용 설정을 바꿔 장애를 만들지 않는다.
