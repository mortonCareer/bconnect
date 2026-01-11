---
name: implement
description: |
  인터페이스 구현 시 사용. Domain & Service 구현체 작성.
  "구현", "Impl", "Implementation", "서비스 구현" 관련 작업 시 자동 적용.
globs:
  - "**/infrastructure/**/*.java"
  - "**/application/**/*Service.java"
  - "**/*Impl.java"
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
- 인터페이스 정의 참고
- 프로젝트 내 유사 코드 참고
- 구현체 작성

## Output Format
1. 구현 코드: 실제 로직
2. 문서화: Javadoc 또는 주석

## Constraints
- 과도한 패턴 사용 지양
- 기술 부채 관리
