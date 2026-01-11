---
name: storage
description: |
  데이터 저장소 관련 코드 작성 시 사용.
  "Entity", "Repository", "JPA", "데이터베이스", "DB", "ERD", "테이블" 관련 작업 시 자동 적용.
globs:
  - "**/entity/**/*.java"
  - "**/domain/**/model/**/*.java"
  - "**/repository/**/*.java"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
---

# Storage Skill
ERD 기반 Entity 및 Repository 작성 가이드입니다.

## 작업
- ERD 문서 참고
- Flyway 마이그레이션 파일 참고
- Entity & Repository 작성

## Output Format
1. Entity 목록
2. Repository 목록
3. 문서화: Javadoc 또는 주석

## Constraints
- ERD와 일치 확인
- 마이그레이션 파일 동기화