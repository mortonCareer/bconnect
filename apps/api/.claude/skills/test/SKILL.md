---
name: test
description: |
  테스트 코드 작성 및 예외 처리 설계 시 사용.
  "테스트", "Test", "코너 케이스", "예외", "Exception", "검증" 관련 작업 시 자동 적용.
globs:
  - "**/test/**/*.java"
  - "**/exception/**/*.java"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
---

# Test Skill
테스트 코드 작성 및 예외 처리 설계 가이드입니다.

## 작업
- 코너 케이스 분석
- 테스트 코드 작성
- 예외 처리 작성

## Output Format
1. 성공/실패 시나리오
2. 예외 목록: 예외 코드 및 처리 방법
3. 테스트 목록 (DisplayName)

## Constraints
- 주요 로직 커버리지 확보
- 엣지 케이스 테스트 필수