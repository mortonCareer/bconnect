---
name: git-cherry-pick
description: 한 브랜치에 쌓인 커밋을 각각 이슈별 브랜치로 분산해 PR을 생성할 때 사용 — `커밋` `브랜치` `분리` `재구성` `나눠` `cherry-pick`
---

# 개요

- 한 브랜치에 누적된 여러 이슈 커밋을 이슈별 독립 브랜치로 분리
- 각 브랜치는 최신 dev 위에 해당 이슈 커밋만 cherry-pick하여 재구성
- 원본 스택은 보존. 원본 커밋은 스택 tip과 reflog로 도달 가능

## 절차

1. 매핑 확정
   - 커밋과 브랜치 대응을 표로 정리
   - 의존 순서에 따라 하위 이슈부터 진행
2. dev 최신화
   - 사용자에게 `git fetch origin` 실행 요청
3. 재구성
   - `git worktree add <경로> -b <브랜치> --no-track origin/dev`
   - `git cherry-pick <해당 이슈 커밋들>`
4. 검증
   - `compileJava` · `compileTestJava` 통과 확인
   - 스프링 테스트 · bruno 검증
5. push · PR · merge
   - 사용자 수행

## 주의사항

- 원본 커밋이 dev에 squash 머지 되므로 항상 최신 dev 기준으로 재구성
- 선행 브랜치 머지 후 dev tip 변경. 다음 재구성 전 fetch 필요
- 브랜치 조작과 커밋 기록 제거는 지시된 범위 내에서만 수행
- git 명령은 명시적 승인 후에만 실행
- SSH 키가 필요한 명령어는 사용자가 진행 · 대기