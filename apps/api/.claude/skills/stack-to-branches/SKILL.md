---
name: stack-to-branches
description: 한 브랜치에 여러 이슈 커밋이 선형으로 쌓인 스택을 이슈별 브랜치로 분산해 각각 dev PR로 정리할 때 사용 — `커밋` `브랜치` `분리` `재구성` `나눠` `cherry-pick
---

# 개요

한 브랜치 tip에 여러 이슈의 커밋이 순차적으로 누적된 경우, 이를 이슈별 독립 브랜치로 분리하여 각각 dev PR로 구성.

## 핵심 원리

- 각 이슈 브랜치는 **`대상 base(dev) + 해당 이슈 커밋`** 으로 구성
- 원본 스택은 그대로 보존 — 원본 커밋은 스택 tip·reflog를 통해 도달 가능하므로 유실되지 않음
- 대상 dev 위에 해당 이슈 커밋만 `cherry-pick`하여 재구성

## 절차

1. **매핑 확정** — 커밋과 이슈 브랜치의 대응을 표로 정리 (의존 순서에 따라 하위 이슈부터)
2. **dev 최신화** — 사용자에게 `git fetch origin` 실행 요청
3. **재구성** :
   ```bash
   git checkout -B <브랜치> <dev tip>
   git cherry-pick <그 이슈 커밋들>
   ```
4. **정합 검증** — `compileJava`, `compileTestJava` 통과 확인 및 전체 bruno 테스트 검증
5. **push** — 사용자 진행

## 주의사항
- **Squash 머지** — feature → dev가 squash 병합이면 원본 커밋이 dev에 그대로 반영되지 않음. 최신 dev 위에 해당 커밋만 cherry-pick하여 재구성
- **머지 후 fetch** — 선행 브랜치가 머지되면 dev tip이 변경됨. 다음 재구성 이전에 반드시 fetch 선행
- git 명령은 **명시적 승인 후에만** 실행. 커밋은 메시지와 파일 범위를 제안하고 확인 (수정·스테이징은 즉시 진행)
- 브랜치 조작과 reset은 지시된 범위 내에서만 수행
