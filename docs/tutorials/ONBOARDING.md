# 신규 합류자 Day 1

> **For**: Morton 팀에 새로 합류한 개발자.
> **You'll be able to**: 노트북에 dev 환경 세팅하고, 첫 PR을 머지해서 워크플로우를 1회 경험한다.

목표 시간: **약 1-2시간** (계정 발급 대기 시간 제외).

---

## Phase 1 — CTO 사전 작업 (합류 전, CTO만)

> 이 섹션은 신규 합류자가 도착하기 **전**에 CTO가 완료한다. **인프라 도구(Vercel/Railway/AWS/Slack/Sentry)는 CTO 단독 책임이라 합류자에게 발급하지 않는다.** 관심사 분리 — 합류자는 코드/이슈/디자인/지식만.

신규 합류자에게 발급:

- [ ] **GitHub** [mortonCareer org](https://github.com/mortonCareer) invite (push/PR 권한)
- [ ] **Figma** file access 추가 (Pro seat 추가 비용 사전 확인)
- [ ] **Notion** workspace invite ([홈](https://www.notion.so/morton-so/27a965d2888b80b4961bcc07957776f8))

각 도구의 정확한 식별자/링크: [`reference/tools.md`](../reference/tools.md).

---

## Phase 2 — 신규 팀원 셋업

### Step 1. 계정 수락 + 2FA

받은 invite 모두 수락하고 **2FA 활성화**:

- GitHub: Settings → Password and authentication → 2FA (TOTP 권장)
- Notion: TOTP

### Step 2. SSH key 등록 (push/pull용)

GitHub에 SSH key 등록:

```bash
ssh-keygen -t ed25519 -C "<your email>"
cat ~/.ssh/id_ed25519.pub  # GitHub Settings → SSH keys 에 등록
```

GPG 서명은 선택 — 팀 정책 강제 X. 필요 시만.

### Step 3. 도구 설치 (AI 자동화 권장)

기본 셋(Node.js 20+, pnpm 9+, gh, direnv, Claude Code 확장)은 [Claude Code](https://claude.com/code)에 `/setup` 또는 별도 셋업 스킬로 자동화 가능 — follow-up 이슈로 분리 (TBD). 수동 설치하려면:

```bash
node --version  # >= 20
corepack enable && pnpm --version  # >= 9
brew install direnv gh
gh auth login
```

### Step 4. 환경 시크릿

`.envrc.local`(direnv 시크릿) 받는 절차는 Notion 페이지로 관리: **[합류자 환경 셋업 가이드](https://www.notion.so/morton-so/27a965d2888b80b4961bcc07957776f8)** (홈에서 검색).

```bash
cd <repo-root>
direnv allow .  # 환경변수 자동 로드 확인
```

---

## Phase 3 — 로컬 환경 verify

### Step 1. Repo clone + 의존성 설치

```bash
git clone git@github.com:mortonCareer/bconnect.git
cd bconnect
pnpm install --frozen-lockfile
# postinstall 시 `pnpm api:generate` (orval) 자동 실행됨
```

### Step 2. 개발 서버 기동 확인

```bash
pnpm dev:career  # http://localhost:3000 — 기술자 PWA
pnpm dev:plan    # http://localhost:3001 — 업체/건축주 웹
```

브라우저에서 두 앱 모두 로딩되는지 확인.

### Step 3. CI 체크 명령 통과 확인

```bash
pnpm api:generate  # OpenAPI → orval client/hook 생성
pnpm lint          # ESLint
pnpm format:check  # Prettier
```

세 명령 모두 0 exit. 실패 시 Slack 도움 요청.

---

## Phase 4 — Day 1 Smoke Test PR

워크플로 1회 경험을 위해 **본인 정보를 추가하는 작은 PR**을 만든다.

### Step 1. 이슈 생성

[새 이슈](https://github.com/mortonCareer/bconnect/issues/new) → "Task" 템플릿 → 제목: `chore: TEAM.md 본인 정보 추가`. issue 번호 확인.

### Step 2. 워크트리 + 브랜치

[`how-to/git-workflow.md`](../how-to/git-workflow.md)의 브랜치 네이밍 룰을 따라:

```bash
git worktree add ~/bconnect-worktrees/<issue-num>-onboarding chore/<issue-num>-onboarding origin/dev
cd ~/bconnect-worktrees/<issue-num>-onboarding
pnpm install --frozen-lockfile
```

### Step 3. team.md 편집

[`docs/reference/team.md`](../reference/team.md)에 본인 행 추가 (또는 GitHub username TBD 채우기).

### Step 4. 커밋 + PR

```bash
git add docs/reference/team.md
git commit -m "chore(docs): <your-name> 본인 정보 추가 (#<issue>)"
git push -u origin chore/<issue>-onboarding
gh pr create --base dev --fill
```

PR 생성 후 1-2분 안에 **Vercel 프리뷰** 자동 배포 — 댓글에 URL 뜸.

### Step 5. CI / QA / 머지

- CI 통과 확인 (lint, format, BE 빌드/테스트)
- 리뷰어 approve 후 본인이 **Squash and Merge**
- main 직접 머지 X — PR 타겟은 항상 `dev`

자세한 CI / QA / 배포는 [`how-to/qa-and-testing.md`](../how-to/qa-and-testing.md), [`how-to/deployment.md`](../how-to/deployment.md).

---

## Phase 5 — 도메인 / 비즈니스 컨텍스트 (5분 개요)

품앗이(BConnect)는 **인테리어 업체-기술자 연결 구인구직 플랫폼**:

- **`apps/career`** (PWA) — 기술자(개인)용. 일감 찾기, 동료 추천, 인증서, 작업물 포트폴리오, 원클릭 업체 조회, 동산보드판(MVP-3) 등.
- **`apps/plan`** (웹) — 업체 + 건축주/발주자용. 기술자 검색, 매칭 요청, 공정표/견적, 반장 리뷰 등.
- **양쪽 공통** — 메시지, 인증, 파일, 알림, 캘린더.

상세 분류는 메모리/Notion(현재 git 미반영). ERD: [Figma 개발 보드](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj).

### 결정 컨텍스트

"왜 이렇게 했나"는 [`explanation/adr/`](../explanation/adr/) 디렉토리 직접 탐색.

---

## Phase 6 — AI / Claude 도구 사용 컨벤션 (필수)

Morton 팀은 Claude Code를 적극 사용. 신규 합류자도 **반드시** 동일 환경 셋업:

- **글로벌 셋업**: `~/.claude/CLAUDE.md` + `~/.claude/rules/*.md`
- **워크스페이스 자동 로드**: repo 루트 `CLAUDE.md` + 각 디렉토리의 `<dir>/CLAUDE.md`가 cwd 기준 자동 로드
- **`docs/`에서 편집 시**: [`docs/CLAUDE.md`](../CLAUDE.md) thin pointer → [`how-to/write-docs.md`](../how-to/write-docs.md) 룰
- **main 직접 push 금지**: hook으로 자동 차단. 우회 시도 X

새 docs 작성 룰: [`how-to/write-docs.md`](../how-to/write-docs.md).

---

## 다 끝났다면

- 개발 사이클: [`how-to/git-workflow.md`](../how-to/git-workflow.md) → [`how-to/development-workflow.md`](../how-to/development-workflow.md) → [`how-to/qa-and-testing.md`](../how-to/qa-and-testing.md) → [`how-to/deployment.md`](../how-to/deployment.md)
- 사실 lookup: [`reference/`](../reference/)
- 결정 이유: [`explanation/adr/`](../explanation/adr/)
- 막혔을 때: 팀 Slack 또는 CTO/CEO DM

환영합니다.
