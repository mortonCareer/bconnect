# Morton 개발 문서

Morton은 업체-기술자 연결 구인구직 플랫폼입니다.

---

## 도구

| 용도         | 도구                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| 기획/보드    | Notion                                                                   |
| 디자인       | Figma                                                                    |
| 코드/이슈    | GitHub                                                                   |
| API 문서     | `packages/api-client/src/openapi.yaml` (SSOT) + VSCode 42Crunch 익스텐션 |
| 인프라       | AWS, Vercel, Railway                                                     |
| 커뮤니케이션 | 각 도구 내 댓글                                                          |

---

## 팀 구성

팀 구성 및 역할에 대한 자세한 내용은 **[TEAM.md](./TEAM.md)**를 참조하세요.

---

## 문서

### 프로세스 가이드

- **[개발 워크플로우](./DEVELOPMENT_WORKFLOW.md)**  
  개발 프로세스, API 스펙 관리, Mock API, API 클라이언트 생성

- **[Git 워크플로우](./GIT_WORKFLOW.md)**  
  이슈 기반 개발, 브랜치 전략, 커밋 규칙, PR/이슈 관리

- **[QA & 테스팅](./QA_AND_TESTING.md)**  
  QA 프로세스, 테스트 범위, 버그 판단 기준

- **[배포](./DEPLOYMENT.md)**  
  배포 환경, 배포 프로세스, 인프라 구성

- **[팀 구성](./TEAM.md)**  
  팀 역할, GitHub/Notion 매핑, 협업 프로세스

- **[푸시 알림 딥링크 규격](./NOTIFICATION_DEEPLINKS.md)**  
  FCM 페이로드 `data.url` 컨벤션, 카테고리별 경로, BE 발송 예시

### 기술 참조

프로젝트 루트의 **[AGENTS.md](../AGENTS.md)**에서 다음 정보를 확인할 수 있습니다:

- 프로젝트 개요 및 기술 스택
- 개발/빌드/테스트 명령어
- 코드 스타일 가이드라인
- 파일 네이밍, Import 순서, 컴포넌트 패턴
- 환경 변수 관리

---

## 빠른 시작

새로운 기능을 개발하는 경우:

1. **[Git 워크플로우](./GIT_WORKFLOW.md)** → 이슈 생성 및 브랜치 작업
2. **[개발 워크플로우](./DEVELOPMENT_WORKFLOW.md)** → API 스펙 및 개발 진행
3. **[QA & 테스팅](./QA_AND_TESTING.md)** → PR 프리뷰에서 QA
4. **[배포](./DEPLOYMENT.md)** → 머지 후 자동 배포
