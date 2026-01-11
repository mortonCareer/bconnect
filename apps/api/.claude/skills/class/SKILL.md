---
name: class
description: |
  클래스 구조 설계 시 사용. DDD 기반 도메인 모델링.
  "클래스 설계", "도메인", "DDD", "Aggregate", "Service 클래스" 관련 작업 시 자동 적용.
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

# Class Skill
DDD 기반 도메인 클래스 설계 가이드입니다.

## 작업
- DDD 문서 참고
- 프로젝트 내 유사 코드 참고
- Domain & Service 클래스 작성

## Output Format
1. 클래스 다이어그램
2. 패키지 구조
3. 의존성 방향

## Constraints
- 순환 의존성 금지
- 과도한 추상화 지양
