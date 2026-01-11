---
description: 참조된 코드의 Git 히스토리 분석. 변경 이력, 작성자, 관련 커밋 확인.
argument-hint: [file-path]
---

# Git 히스토리 분석: $ARGUMENTS

## 분석 대상
!`git log --oneline --follow -20 -- "$ARGUMENTS"`
!`git log --oneline --all --grep="$ARGUMENTS" -10`
!`git log --oneline -S "$ARGUMENTS" -10`

## 작업
- 파일 변경 이력 분석
- 관련 커밋 검색
- 주요 작성자 식별

## 결과 형식
- 파일: [파일 경로]
- 총 커밋: N개
- 주요 작성자: [작성자 목록]
- 주요 변경 이력: [커밋 해시] - [메시지] ([작성자], [날짜])
- 보고: [코드 변경 패턴 또는 특이사항]
