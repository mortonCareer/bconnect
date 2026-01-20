---
name: interface
description: |
  인터페이스 설계 시 사용. 계약 정의 및 추상화.
  "인터페이스", "Interface", "계약", "추상화", "의존성 역전" 관련 작업 시 자동 적용.
globs:
  - "**/domain/**/*.java"
  - "**/service/**/*.java"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
---

# Interface Skill
Domain & Service 인터페이스 설계 가이드입니다.

## 작업
- 해당 도메인의 API & Storage 코드 참고
- 프로젝트 내 유사 코드 참고
- Domain & Service 인터페이스 정의 
- 문서화: Javadoc 또는 주석

## Output Format
- 선언된 인터페이스 목록: [클래스, 내용]

## Constraints
- 명확한 계약 정의
- 적절한 추상화 수준