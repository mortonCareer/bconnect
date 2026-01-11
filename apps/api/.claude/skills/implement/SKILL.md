---
name: implement
description: |
  인터페이스 구현 시 사용. Domain & Service 구현체 작성.
  "구현", "Impl", "Implementation", "서비스 구현" 관련 작업 시 자동 적용.
globs:
  - "**/domain/**/*.java"
  - "**/service/**/*.java"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
---

# Implement Skill
Domain & Service 구현체 작성 가이드입니다.

## 작업
- 해당 도메인의 API & Storage 코드 참고
- 프로젝트 내 유사 코드 참고
- Domain & Service 구현체 작성

## Output Format
- 구현된 인터페이스: [클래스, 내용]

## Constraints
- 과도한 패턴 사용 지양
- 기술 부채 관리
