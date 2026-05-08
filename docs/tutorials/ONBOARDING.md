# 신규 합류자 Day 1

> **For**: Morton 팀에 새로 합류한 개발자.
> **You'll be able to**: 노트북에 dev 환경 세팅하고, 첫 PR을 머지해서 워크플로우를 1회 경험한다.

목표 시간: **약 2-4시간** (계정 발급 대기 시간 제외).

---

## Phase 1 — CTO 사전 작업 (합류 전, CTO만)

> 이 섹션은 신규 합류자가 도착하기 **전**에 CTO가 완료한다.

신규 합류자에게 다음을 모두 발급/초대:

- [ ] **GitHub** [mortonCareer org](https://github.com/mortonCareer) invite (push/PR 권한)
- [ ] **Vercel** [Morton 팀](https://vercel.com/morton-2262d67a) member 추가
- [ ] **Railway** project access ([Production 프로젝트](https://railway.com/project/90cd6d09-4c7b-415f-b13f-3d6b6051769a?))
- [ ] **AWS** IAM user 생성 + MFA 강제 + access key 발급 (CTO가 직접 전달)
- [ ] **Figma** file access 추가 (Pro seat 추가 비용 사전 확인)
- [ ] **Notion** workspace invite ([홈](https://www.notion.so/morton-so/27a965d2888b80b4961bcc07957776f8))
- [ ] **Slack** workspace invite
- [ ] **Sentry** [morton-2l org](https://morton-2l.sentry.io/) member 추가

각 도구의 정확한 식별자/링크: [`reference/tools.md`](../reference/tools.md).

---

## Phase 2 — 신규 팀원 셋업 (Day 1 오전)

### Step 1. 계정 수락 + 2FA

받은 invite 모두 수락하고 **2FA 활성화**:

- GitHub: Settings → Password and authentication → 2FA (TOTP 권장)
- Vercel / Railway: 자동 (GitHub OAuth)
- AWS: 별도 MFA 디바이스 등록 필수 (**AWS MFA OTP는 AI 도움 불가 영역** — 본인 디바이스 + 백업 코드 안전 보관)
- Notion / Slack / Sentry: TOTP

### Step 2. SSH/GPG key 등록

GitHub에 SSH key + GPG key 등록 (commit signing 권장):

```bash
# SSH (push/pull)
ssh-keygen -t ed25519 -C "<your email>"
cat ~/.ssh/id_ed25519.pub  # GitHub Settings → SSH keys 에 등록

# GPG (commit 서명, 선택)
gpg --full-generate-key
gpg --armor --export <KEY-ID>  # GitHub Settings → GPG keys 에 등록
git config --global user.signingkey <KEY-ID>
git config --global commit.gpgsign true
```

### Step 3. 외부 도구 CLI 설치

기본 셋:

```bash
# Node.js 20+ 와 pnpm 9+
node --version  # >= 20
corepack enable  # pnpm 활성화
pnpm --version  # >= 9

# direnv (.envrc.local 시크릿 자동 로드)
brew install direnv  # macOS
# bash/zsh 셸 hook: https://direnv.net/docs/hook.html

# GitHub CLI
brew install gh
gh auth login

# Vercel / Railway / AWS CLI (선택, 운영 권한 있을 때만)
brew install vercel railway awscli
```

각 CLI의 사용 시점 / 권한: [`reference/tools.md`](../reference/tools.md).

### Step 4. `.envrc.local` 시크릿 받기

CTO에게 `.envrc.local` 파일을 요청 (Slack DM 또는 1Password). **Git에 커밋되지 않음**.

```bash
cd <repo-root>
# CTO 가 보낸 .envrc.local 을 repo 루트에 저장
direnv allow .  # 환경변수 자동 로드 확인
```

---

## Phase 3 — 로컬 환경 verify (Day 1 오후)

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
pnpm dev:plan    # http://localhost:3001 — 업체 웹
```

브라우저에서 두 앱 모두 로딩되는지 확인.

### Step 3. CI 체크 명령 통과 확인

```bash
pnpm api:generate  # OpenAPI → orval client/hook 생성
pnpm lint          # ESLint
pnpm format:check  # Prettier
```

세 명령 모두 0 exit. 실패 시 Slack에 도움 요청.

---

## Phase 4 — Day 1 Smoke Test PR

워크플로 1회 경험을 위해 **본인 정보를 추가하는 작은 PR**을 만든다.

### Step 1. 이슈 생성

[새 이슈](https://github.com/mortonCareer/bconnect/issues/new) → "Task" 템플릿 → 제목: `chore: TEAM.md 본인 정보 추가`. 작성 후 issue 번호 확인.

### Step 2. 워크트리 + 브랜치

[`how-to/git-workflow.md`](../how-to/git-workflow.md)의 브랜치 네이밍 룰을 따라:

```bash
# 워크트리 컨벤션: ~/<프로젝트>-worktrees/<브랜치명>
git worktree add ~/bconnect-worktrees/<your-issue-number>-onboarding chore/<your-issue-number>-onboarding origin/dev
cd ~/bconnect-worktrees/<your-issue-number>-onboarding
pnpm install --frozen-lockfile
```

### Step 3. TEAM.md 편집

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
- 리뷰어가 approve하면 본인이 **Squash and Merge**로 머지
- main 브랜치 직접 머지 X — PR 타겟은 항상 `dev`

자세한 CI / QA / 배포는 [`how-to/qa-and-testing.md`](../how-to/qa-and-testing.md), [`how-to/deployment.md`](../how-to/deployment.md).

---

## Phase 5 — 도메인 / 비즈니스 컨텍스트 (5분 개요)

품앗이(BConnect)는 **인테리어 업체-기술자 연결 구인구직 플랫폼**:

- **두 사용자 그룹**:
  - 기술자(개인): `apps/career` (PWA) — 일감 찾기, 인증서 관리, 채팅
  - 업체(법인): `apps/plan` (웹) — 기술자 찾기, 매칭 요청, 동산보드판
- **핵심 도메인**: 매칭(매칭 요청 / 추천 / coworker 관계), 인증(전화 OTP + 인증서), 채팅, 알림(FCM web push)
- **ERD**: [Figma 개발 보드](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj)
- **API spec**: [`reference/specs/`](../reference/specs/) (OpenAPI 3.1, 도메인별 분리)

### 결정 컨텍스트

"왜 이렇게 했나"는 [`explanation/adr/`](../explanation/adr/) 참조:

- [ADR-0002](../explanation/adr/0002-single-s3-bucket-with-prefix.md) — S3 단일 버킷
- [ADR-0003](../explanation/adr/0003-openapi-3-1-with-domain-split.md) — OpenAPI 3.1 + 도메인 분리
- [ADR-0004](../explanation/adr/0004-api-response-envelope.md) — API response envelope

---

## Phase 6 — AI / Claude 도구 사용 컨벤션

Morton 팀은 Claude Code를 적극 사용. 신규 합류자도 동일 환경 셋업 권장:

- **글로벌 셋업**: `~/.claude/CLAUDE.md` + `~/.claude/rules/*.md` (개인 룰)
- **워크스페이스 자동 로드**: repo 루트의 `CLAUDE.md` + 각 디렉토리의 `<dir>/CLAUDE.md`가 cwd 기준 자동 로드
- **`docs/`에서 편집 시**: [`docs/CLAUDE.md`](../CLAUDE.md)가 thin pointer로 자동 로드 → [`how-to/write-docs.md`](../how-to/write-docs.md) 룰 적용
- **main 직접 push 금지**: hook으로 자동 차단 (`.claude/hooks/main-write-block.sh`). 우회 시도 X

새 docs 작성 룰: [`how-to/write-docs.md`](../how-to/write-docs.md).

---

## 다 끝났다면

- **개발 사이클 워크플로우**: [`how-to/git-workflow.md`](../how-to/git-workflow.md) → [`how-to/development-workflow.md`](../how-to/development-workflow.md) → [`how-to/qa-and-testing.md`](../how-to/qa-and-testing.md) → [`how-to/deployment.md`](../how-to/deployment.md)
- **사실 lookup**: [`reference/`](../reference/)
- **결정 이유**: [`explanation/adr/`](../explanation/adr/)
- **막혔을 때**: 팀 Slack에 질문. CTO/CEO에게 직접 DM도 OK.

환영합니다.
