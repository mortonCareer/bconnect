---
description: 코드 리팩터링 수행. 변경사항 참고, 코드 패턴 분석, 단순화 및 개선.
argument-hint: [file-path 또는 class-name]
---

# 리팩터링: $ARGUMENTS

## 분석 대상
!`git diff --cached --name-status`
!`git diff --cached --stat`

## 작업
- 코드 변경사항 분석
- 코드 패턴 분석
- 코드 단순화 및 리팩터링 수행

## 참고 자료
- Refactoring (Martin Fowler, Kent Beck)

## 결과 형식
- 발견된 스멜: N개
- 1. [스멜 타입] - [위치:라인]
   - 문제: [설명]
   - 제안: [리팩터링 기법]
   - 기대 효과: [개선점]
- 주의사항