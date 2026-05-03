# Figma Checks

코드의 인라인 `@figma`/`@figma-state` JSDoc 주석과 실제 Figma 파일 사이의 drift를 자동 감지하는 CI 스크립트.

배경/근거: [#257](https://github.com/mortonCareer/bconnect/issues/257), 인라인 매핑 마이그레이션은 [#256](https://github.com/mortonCareer/bconnect/issues/256).

## 실행

```bash
# 실제 issue 갱신 (FIGMA_ACCESS_TOKEN + GITHUB_TOKEN 필요)
pnpm figma:check

# 출력만 stdout (issue 조작 X) — 로컬 디버깅용
pnpm figma:check:dry
```

GHA에서는 `.github/workflows/figma-state-check.yml` (매주 월 09:00 KST + workflow_dispatch).

## 구조 (함수 분리)

```text
scripts/figma-checks/
├── index.mjs                    # 진입점 — CHECKS 배열 등록
├── check-figma-coverage.mjs     # 첫 체크: Ready 마킹 frame 커버리지 (figma-first)
└── lib/
    ├── figma-context.mjs        # Figma API + 코드 @figma 추출 (공유)
    └── report.mjs               # 단일 누적 issue 갱신 (공유)
```

새 체크 추가:

1. `check-<name>.mjs` 작성 (signature: `(ctx) => Promise<Finding[]>`)
2. `index.mjs`의 `CHECKS` 배열에 import + 추가
3. 끝.

## 환경 변수

| 변수                 | 용도                                   |
| -------------------- | -------------------------------------- |
| `FIGMA_ACCESS_TOKEN` | Figma REST API 호출용 (필수)           |
| `GITHUB_TOKEN`       | issue 생성/갱신용 (필수, dry-run 제외) |
| `GITHUB_REPOSITORY`  | `owner/repo` 형식 (GHA 자동 주입)      |

GHA secrets로 등록 필요. 로컬 테스트 시 `.env`에서 자동 로드됨 (direnv).

## 동작 (현재 단일 체크: missing-states)

1. `apps/`/`packages/`의 모든 `.tsx`/`.ts` 파일에서 `@figma`/`@figma-state` JSDoc 추출
2. Figma REST API로 파일 트리 한 번에 로드 (parent 관계 포함)
3. 각 `@figma` 노드의 부모 섹션에서 같은 prefix를 가진 sibling frame 찾기
4. 코드의 `@figma-state` 라인 개수와 비교 → 누락 보고
5. 단일 누적 issue (`🤖 figma-drift` 라벨) 생성/갱신, 0건이면 자동 close

`@figma-scaffold`/`@figma-pending` 마킹된 페이지는 검사 제외.

## 후속 추가 예정 체크 (#258 등)

- `check-naming-convention.mjs` — frame 이름이 합의된 컨벤션 따르는지
- `check-scaffold-isolation.mjs` — `@figma-scaffold` 컴포넌트가 production 코드에 침투하지 않는지
