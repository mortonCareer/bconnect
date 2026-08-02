# 신규 합류자 Day 1

> **For**: Morton 팀에 새로 합류한 개발자.
> **You'll be able to**: 개발 환경 세팅하고, 첫 PR을 머지해서 워크플로우를 1회 경험.

---

## Phase 1 — CTO 사전 작업 (합류 전, CTO만)

신규 합류자에게 발급:

- **GitHub** [mortonCareer org](https://github.com/mortonCareer) invite (push/PR 권한)
- **Figma** file access 추가 (Pro seat 추가 비용 사전 확인)
- **Notion** workspace invite ([홈](https://www.notion.so/morton-so/27a965d2888b80b4961bcc07957776f8))
- **Slack** 워크스페이스 초대

각 도구의 정확한 식별자/링크: [`reference/tools.md`](../reference/tools.md).

---

## Phase 2 — 신규 팀원 셋업

### Step 1. 도구 설치

기본 셋: Node.js 20+, pnpm 9+, gh, direnv, JDK 21 (로컬 BE 실행용).

```bash
node --version  # >= 20
corepack enable && pnpm --version  # >= 9
brew install direnv gh
gh auth login
```

**Claude Code** — VSCode Extension 또는 CLI 둘 중 하나로 설치 ([공식 가이드](https://claude.com/code)).

---

## Phase 3 — Repo 셋업

### Step 1. Repo clone

```bash
git clone git@github.com:mortonCareer/bconnect.git
cd bconnect
```

### Step 2. 환경 시크릿

`.envrc.local`(direnv 시크릿) 받는 절차는 Notion 페이지로 관리: **[로컬 환경변수](https://www.notion.so/morton-so/384965d2888b8092be18f7bab46d0f8d)**.

```bash
direnv allow # 디렉토리 진입 시 환경 변수 자동 설정
```

### Step 3. 의존성 설치 + dev 서버

```bash
cd apps/api && ./gradlew bootRun  # http://localhost:8080 — 로컬 BE

pnpm install --frozen-lockfile

pnpm dev:career  # http://localhost:3000 — 기술자 PWA
pnpm dev:plan    # http://localhost:3001 — 업체 웹
```

---

## Phase 4 — 팀원 정보 등록 PR

워크플로 1회 경험을 위해 **본인 정보를 추가하는 작은 PR** 을 만든다.

### Step 1. 이슈 생성

[새 이슈](https://github.com/mortonCareer/bconnect/issues/new) → 제목: `chore: team.md 본인 정보 추가`. issue 번호 확인.

### Step 2. 브랜치

[`how-to/git-workflow.md`](../how-to/git-workflow.md) 의 브랜치 네이밍 룰:

```bash
git checkout dev && git pull origin dev
git checkout -b chore/<issue-num>-onboarding
```

> 여러 작업을 동시에 하고 싶으면 git worktree 를 써도 된다 (옵션).

### Step 3. team.md 편집 + 커밋 + PR

[`docs/reference/team.md`](../reference/team.md) 에 본인 행 추가:

```bash
git add docs/reference/team.md
git commit -m "chore(docs): <your-name> 본인 정보 추가 (#<issue>)"
git push
```

push 후 PR 은 GitHub 웹에서 생성

### Step 4. 머지

- CI 통과 확인 (lint, format, BE 빌드/테스트)
- 리뷰어 approve 후 본인이 머지
- main 직접 머지 X — PR 타겟은 항상 `dev`

---

## Phase 5 — 도메인 / 비즈니스 컨텍스트 (5분 개요)

품앗이(BConnect) 는 **인테리어 업체-기술자 연결 구인구직 플랫폼**:

- **`apps/career`** (PWA) — 기술자(개인) 용. 일감 찾기, 동료 추천, 인증서, 작업물 포트폴리오, 원클릭 업체 조회 등.
- **`apps/plan`** (웹) — 업체 + 건축주/발주자 용. 기술자 검색, 매칭 요청, 공정표/견적, 반장 리뷰 등.
- **양쪽 공통** — 메시지, 인증, 파일, 알림, 캘린더.

"왜 이렇게 했나" 는 [`explanation/adr/`](../explanation/adr/) 직접 탐색.

---

## 다 끝났다면

- 개발 사이클: [`how-to/git-workflow.md`](../how-to/git-workflow.md) → [`how-to/development-workflow.md`](../how-to/development-workflow.md) → [`how-to/deployment.md`](../how-to/deployment.md)
- 사전: [`reference/`](../reference/)
- 결정 이유: [`explanation/adr/`](../explanation/adr/)
- 새 docs 작성 룰: [`how-to/write-docs.md`](../how-to/write-docs.md)
- 막혔을 때: 팀 Slack에 자유롭게 질문

환영합니다.
