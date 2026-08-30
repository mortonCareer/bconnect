# CLAUDE.md

## 프로젝트 구조

프로젝트는 pnpm 모노레포 구조

- `apps/career` - 기술자용 앱
- `apps/plan` - 업체용 웹
- `apps/company` - 회사 홈페이지
- `apps/crawler` - 기술자 크롤러
- `apps/api` - API 서버 (Spring Framework)
- `packages/ui` - 공유 UI 컴포넌트 (Tailwind V4)
- `packages/api-client` - 자동 생성 API 클라이언트 (Orval)
- `packages/config` - 공유 설정
- `packages/features` - 공유 UI
- `packages/mocks` - MSW 핸들러
- `packages/devtools` - 개발 도구 (MSW, Agentation)
- `packages/push` - 푸시 알림 UI · 클라이언트
- `packages/data-jobs` - 원클릭 조회 데이터 동기화

## 가이드

- 읽기 작업은 READ 도구로, 쓰기 작업은 WRITE 도구로 처리
- 사용자가 승인한 사항과 AI가 제안한 사항을 구분
- 비가역적인 명령어는 사용자의 명시적인 승인 내에서만 사용
- 특정 명령어에 대한 오류가 3회 이상 발생한 경우 해당 작업을 생략하고 보고
- 보고서는 HTML 형식으로 생성
- 보고서가 필요한지 검토, 가능한 최단 출력

## 문체

- 두괄식 · 개조식으로 간결하게 서술
- em dash 또는 괄호를 활용한 부연설명 금지
- 한 문장은 한 가지 핵심만 서술
- 고유 표현은 원문 그대로 인용
- 명시적인 지시가 없다면 주석 작성 금지
- 이모지 사용 자제

## 사실성

- 라이브러리 활용시 공식 문서를 근거로 답변
- 웹 검색시 신뢰할 만한 국문 · 영문 자료를 근거로 답변
- 단일 출처 : 지정된 원본만 근거로 사용. 사전지식 혼입 금지
- 창작 금지 : 원본에 없는 내용을 추측해 채우지 않음
- 파생 금지 : 2차 문서 작성 시 1차 문서만 출처로 사용
- 부재 명시 : 정보가 없으면 없다고 기술
- 출처 명시 : 외부 참조시 래퍼런스, 내부 참조시 파일명/위치 명시

## 문서 목록

[Diátaxis](https://diataxis.fr) 프레임워크에 따라 문서 위치를 결정합니다

- [온보딩 문서](../docs/tutorials/ONBOARDING.md)
- [문서 작성법](../docs/how-to/write-docs.md)
- [개발 프로세스](../docs/how-to/development.md)
- [배포 프로세스](../docs/how-to/deployment.md)
- [환경변수 관리](../docs/how-to/manage-variables.md)
- [입력 폼 작성법](../docs/how-to/react-hook-form.md)
- [QA 로그인법](../docs/how-to/qa-login.md)
- [보편언어](../docs/reference/ubiquitous-language.md)
- [외부 서비스](../docs/reference/third-party.md)
- [프론트엔드 공통 처리](../docs/reference/frontend-patterns.md)
- [Lint 관리](../docs/reference/lint.md)
- [피그마 태그](../docs/reference/figma-tag.md)
- [피그마 매핑](../docs/reference/figma-mapping.md)
- [API 클라이언트](../docs/reference/package-api-client.md)
- [MSW 핸들러 패키지](../docs/reference/package-mocks.md)
- [기술자 크롤러](../docs/reference/app-crawler.md)
- [Vercel 인프라](../docs/reference/infra-vercel.md)
- [Railway 인프라](../docs/reference/infra-railway.md)
- [GCP 인프라](../docs/reference/infra-firebase.md)
- 기술적 의사결정 문서 : `docs/explanation/adr`
