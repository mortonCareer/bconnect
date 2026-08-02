# apps/career

기술자(blue-collar worker) PWA. Next.js App Router.

> 공통 FE 패턴은 [CLAUDE-FE.md](../CLAUDE-FE.md) (아래 `@import`). 여기는 career 전용만.

@../CLAUDE-FE.md

## Commands

```bash
pnpm dev:career         # http://localhost:3000
pnpm build:career
pnpm lint:career
```

루트에서 실행 (모노레포 어느 디렉토리에서나 가능).

## Career-only

- **PWA + Android TWA** — Android 앱은 [android-twa/](./android-twa/README.md) 로 패키징. 콘텐츠는 라이브 URL 로드라 웹 배포만으로 갱신되고, 앱 재빌드는 앱 메타(이름·아이콘 등) 변경 시에만
