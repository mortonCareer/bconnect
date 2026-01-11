---
name: interface
description: |
  인터페이스 설계 시 사용. 계약 정의 및 추상화.
  "인터페이스", "Interface", "계약", "추상화", "의존성 역전" 관련 작업 시 자동 적용.
globs:
  - "**/domain/**/repository/*.java"
  - "**/domain/**/service/*.java"
  - "**/port/**/*.java"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
---

# Interface Skill
Domain & Service 인터페이스 설계 가이드입니다.

## 작업
- 도메인 요구사항 분석
- 프로젝트 내 유사 코드 참고
- 인터페이스 정의

## Output Format
1. 인터페이스 목록
2. 문서화: Javadoc 또는 주석

## Constraints
- 명확한 계약 정의
- 적절한 추상화 수준