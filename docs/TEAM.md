# 팀 구성

Morton 프로젝트의 팀 구성 및 역할을 정의합니다.

---

## 팀원

| 역할       | 이름   | GitHub            | 주요 작업                                           |
| ---------- | ------ | ----------------- | --------------------------------------------------- |
| CEO        | 이송목 | `fine-pine`       | ERD 설계, BE 구현, API 리뷰, 최종 QA                |
| CTO        | 손장수 | `manamana32321`   | API 스펙 설계, 퍼블리싱, FE 구현, 인프라, 코드 리뷰 |
| 프론트엔드 | 김예진 | TBD               | 퍼블리싱, FE 구현                                   |
| 디자이너   | 박정윤 | `julyatpark-star` | UI/UX 시안, UI 검수                                 |

---

## 역할 및 책임

### CEO

**백엔드 개발 책임**

- ERD 설계 및 데이터베이스 스키마 관리
- Spring Boot API 구현
- Repository, Service, Controller 작성
- 단위 테스트 작성
- API 스펙 리뷰 및 승인
- 최종 QA (실사용자 관점 검증)

**담당 영역:**

- `apps/api/` - Spring Boot 백엔드
- 데이터베이스 마이그레이션
- Backend 성능 최적화

### CTO

**프론트엔드 + API 스펙 + 인프라 책임**

- API 스펙 초안 작성 (`packages/api-client`)
- 퍼블리싱 (Figma → React) — Frontend와 공유
- Next.js 앱 구현 (Career, Plan) — Frontend와 공유
- 인프라 관리 (Vercel, Railway, AWS, Terraform)
- 코드 리뷰 및 기능 테스트
- AI/CI 도구 인프라

**담당 영역:**

- `apps/career/`, `apps/plan/` - Next.js 앱 (Frontend와 공유)
- `packages/ui/` - UI 컴포넌트 (Frontend와 공유)
- `packages/api-client/` - API 클라이언트
- `packages/config/` - 공통 설정
- `infra/` - Terraform 인프라 코드
- `.github/`, `scripts/` - CI/도구

### Frontend

**프론트엔드 개발 책임**

- 퍼블리싱 (Figma → React) — CTO와 공유
- Next.js 앱 구현 (Career, Plan) — CTO와 공유
- 공통 UI 컴포넌트 작성

**담당 영역:**

- `apps/career/`, `apps/plan/` - Next.js 앱 (CTO와 공유)
- `packages/ui/` - UI 컴포넌트 (CTO와 공유)

### 디자이너

**UI/UX 디자인 책임**

- Figma 시안 작성
- 디자인 시스템 관리
- UI 검수 (Vercel 프리뷰 환경)
- 디자인 피드백 제공

**담당 영역:**

- Figma 디자인 파일
- 디자인 토큰
- UI/UX 가이드라인

---

## GitHub 작업 매핑

담당자/리뷰어의 실제 GitHub 핸들은 위 [팀원](#팀원) 표 참조.

### Issue 담당자 자동 할당

| 작업 유형         | 담당자         | 비고               |
| ----------------- | -------------- | ------------------ |
| `⚙️ BE`           | CEO            |                    |
| `📋 api-spec`     | CTO + CEO      | CTO 작성, CEO 리뷰 |
| `💻 FE`           | CTO + Frontend |                    |
| `🎨 publishing`   | CTO + Frontend |                    |
| `☁️ infra`        | CTO            |                    |
| `🐛 bug:BE`       | CEO            |                    |
| `🐛 bug:FE`       | CTO + Frontend |                    |
| `🐛 bug:api-spec` | CTO + CEO      | 함께 결정          |

### PR 리뷰어 자동 할당

| 변경 영역                | 리뷰어      |
| ------------------------ | ----------- |
| `apps/api/` 포함         | CEO         |
| 프론트엔드/인프라만 변경 | 리뷰어 없음 |
| API 스펙 변경            | 둘 다       |

---

## 협업 프로세스

### API 스펙 설계

```
CTO: OpenAPI 스펙 초안 작성
    ↓
GitHub PR 생성
    ↓
CEO: API 스펙 리뷰
    ↓
피드백 반영 및 논의
    ↓
합의 후 main 브랜치 머지
```

### 기능 개발

```
디자인 (디자이너)
    ↓
API 스펙 합의 (CTO + CEO)
    ↓
병렬 개발
  ├─ BE 구현 (CEO)
  └─ FE 구현 (CTO)
    ↓
API 연동 및 테스트
    ↓
QA
  ├─ 디자이너: UI 검수
  ├─ CTO: 기능 테스트
  └─ CEO: 최종 QA
    ↓
프로덕션 배포
```

### 버그 수정

```
문제 발견
    ↓
버그 판단 (api-spec/BE/FE)
    ↓
GitHub Issue 생성 + 담당자 할당
    ↓
담당자 수정
    ↓
PR 생성 + 리뷰어 할당
    ↓
머지 후 배포
```

---

## 커뮤니케이션

각 도구의 계정/식별자/링크는 [TOOLS.md](TOOLS.md) 참조. 본 섹션은 **언제 어디서 무엇을 논의하는가** 만 다룸.

| 채널           | 사용 맥락                               |
| -------------- | --------------------------------------- |
| Notion         | 기획, 스프린트 계획, 작업 보드, 지식 KB |
| Figma          | 디자인 시안 검토, 디자인 피드백         |
| GitHub PR/이슈 | 코드 리뷰, 이슈 트래킹, 기술 논의       |
| Slack          | 일상 커뮤니케이션 (선택)                |

---

## 참고 문서

- [Git Workflow](./GIT_WORKFLOW.md) - 이슈/PR 프로세스
- [Development Workflow](./DEVELOPMENT_WORKFLOW.md) - 개발 프로세스
- [QA & Testing](./QA_AND_TESTING.md) - 버그 판단 기준
