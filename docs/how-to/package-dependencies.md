# Package Dependency Versioning

> **For**: JS workspace(apps/career·plan·company, packages/*)에 dep 을 추가·변경하는 사람 또는 AI. `apps/api`(Gradle)·`apps/crawler`(uv)는 해당 없음.
> **You'll be able to**: pnpm catalog 결정 트리에 따라 dep 을 추가하고 syncpack 검증을 통과한다.

같은 외부 dep 가 여러 package.json 에 분산되면 spec range·lockfile resolution 이 갈라져 디버깅 비용이 커진다. dep 버전에도 SSoT 원칙을 적용한다.

## 핵심 원칙

**같은 dep 이 2+ package.json 에 있으면 [pnpm catalog](https://pnpm.io/catalogs) 사용**. syncpack 룰(`.syncpackrc.json` 의 "공유 dep 은 catalog: 강제" versionGroup)이 이를 강제한다.

## 새 dep 추가 결정 트리

- 이미 다른 package.json 에 있는 dep 인가?
  - **No (단일 package 만 사용)** → 직접 추가: `pnpm --filter <package> add <dep>`
  - **Yes (또는 공유 가능성 있음)** → catalog 사용:
    1. `pnpm-workspace.yaml` 의 `catalog:` 에 추가
    2. `.syncpackrc.json` 의 "공유 dep" versionGroup `dependencies` 배열에 추가
    3. `pnpm --filter <package> add <dep>@catalog:`

기존 dep 의 버전 변경: catalog 에 있으면 `pnpm-workspace.yaml` 한 줄만 수정, 아니면 모든 사용처 동시 수정 (syncpack 이 강제).

## 검증

```bash
pnpm package:check   # 로컬 검증
pnpm package:fix     # 자동 수정 (highest semver 정렬)
```

CI 의 `ci-packages` job 이 모든 PR 에서 자동 검증.

## 자주 하는 실수

- **같은 dep 을 다른 spec 으로 추가** — `foo: "^2.13.6"` / `bar: "^2.0.0"` 식 drift. 둘 다 `"catalog:"` 로
- **peerDependencies spec 불일치** — 본 monorepo 는 self-contained 라 peerDep 도 정확한 버전으로 핀 (`syncpack fix` default)

## Tooling

- [syncpack](https://jamiemason.github.io/syncpack/) — version mismatch 검사 + auto-fix
- [pnpm catalog](https://pnpm.io/catalogs) — workspace 차원 dep 버전 SSoT (pnpm 9+)
