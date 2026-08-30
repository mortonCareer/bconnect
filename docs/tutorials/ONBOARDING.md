# 온보딩 문서

> 대상: 신입 개발자<br>
> 학습 목표: 첫 PR을 머지해서 워크플로우를 1회 수행하기

## Phase 1. 협업 도구

신규 합류자에게 발급:

- GitHub 조직 초대 [바로가기](https://github.com/orgs/mortonCareer/people)
- Figma 디자인 파일 공유 [바로가기](https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS)
- Notion 워크스페이스 초대 [바로가기](https://www.notion.so/morton-so/27a965d2888b80b4961bcc07957776f8)
- Slack 초대 [Slack 워크스페이스](https://morton-rzr9095.slack.com)

## Phase 2. 개발 환경 세팅

- [Node.js : Download](https://nodejs.org/en/download)
- [pnpm : Installation](https://pnpm.io/installation)
- [Adoptium : Temurin Releases](https://adoptium.net/temurin/releases)
- [direnv : Installation](https://direnv.net/docs/installation.html)
- [Visual Studio Code : Download](https://code.visualstudio.com/download)
- [extensions.json](../../.vscode/extensions.json)
- [Claude Code : 설정](https://code.claude.com/docs/ko/setup)

다음 파일로 버전 확인

- [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
- [package.json](../../package.json)

## Phase 3. 서버 가동

### Step 1. 리포지토리 클론

```bash
git clone git@github.com:mortonCareer/bconnect.git
cd bconnect
```

### Step 2. 환경변수 주입

`.envrc.local` 파일 설정. [환경변수](https://www.notion.so/morton-so/384965d2888b8092be18f7bab46d0f8d) 문서 참고

```bash
direnv allow
```

### Step 3. 의존성 설치 · 서버 가동

```bash
cd apps/api && ./gradlew bootRun  # BE

pnpm install --frozen-lockfile

pnpm dev:career # 기술자 FE
pnpm dev:plan   # 업체 FE
```

## Phase 4. 워크플로우 실습

[개발법](../how-to/development.md) 문서 참고

추가로 내부 문서 모두 확인해주시고 궁금한 점 있으면 편하게 질문 주세요.
환영합니다.
