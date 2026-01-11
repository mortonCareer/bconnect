---
description: 에이전트별 시작 루틴 실행. 문서 확인, 변경사항 분석, 코드베이스 분석 수행.
argument-hint: [agent: librarian|designer|architect|coder|qa]
---

# 에이전트 초기화: $ARGUMENTS

## 분석 대상
!`git branch --show-current`
!`git status --short`
!`git log --oneline -10`

## 작업
- `CLAUDE.md` 파일 확인
- 현재 브랜치와 작업 상태 확인
- 에이전트별 초기화 수행

### librarian
- `terraform.tf`, `build.gradle` 분석
- 의존성 업데이트 및 보안취약점 보고

### designer
- API 문서 확인, 엔드포인트 분석, 불일치사항 보고

### architect
- DDD 문서 확인, jdeps 패키지 의존성 확인, 불일치사항 보고

### coder
- Serena MCP 호출

### qa
- 최근 이슈/버그 확인, 테스트 실패 현황 확인

## 결과 형식
- 에이전트: [에이전트 타입]
- 브랜치: [현재 브랜치]
- 상태: [작업 상태]
- 결과: [수행한 작업 목록]
- 보고: [발견된 이슈 또는 주의사항]
