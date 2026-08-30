# 환경변수 관리

> 대상: 전체 개발자<br>
> 학습 목표: 변수의 공개/비밀 여부에 따라 적합한 저장 위치를 선정하고 환경변수를 올바르게 관리할 수 있다.

## 디렉터리별 파일 구성

각 디렉터리별로 다음과 같은 구성으로 환경변수를 관리합니다.

| 구분   | 대상                          | 공개값            | 비밀값             | 비밀값 템플릿              |
| ------ | ----------------------------- | ----------------- | ------------------ | -------------------------- |
| 로컬   | apps                          | 서비스별 `.envrc` | `.envrc.local`     | `.envrc.example`           |
| 로컬   | 그 외 패키지 · 스크립트       | 루트 `.envrc`     | `.envrc.local`     | `.envrc.example`           |
| 테라폼 | api · career · plan · company | `variables`       | `terraform.tfvars` | `terraform.tfvars.example` |
| CI/CD  | GitHub Actions                | Variables         | Secrets            | -                          |

Git에서는 공개값과 비밀값 템플릿 파일만 추적하며, 비밀값 실값은 노션 [환경변수](https://www.notion.so/morton-so/384965d2888b8092be18f7bab46d0f8d) 페이지에서 관리합니다.

### 비밀값 템플릿

```bash
export VAR_NAME=your_var_name
# 공개/비밀값 · 선택/필수
# 발급처 : [제공자 : 문서 제목](URL)
# 설명 : 용도
# 비고 : 주의사항 · 특이사항

```

- 값은 더미로 작성하고, 실값은 `.envrc` 또는 노션에서 관리합니다
- 발급처 · 설명 · 비고는 해당 내용이 없으면 생략합니다

## 가이드

다음과 같은 절차로 환경변수를 추가합니다.
서비스에서 기대한 환경변수가 없다면, 애플리케이션 시작 시점에 오류가 발생하도록(fast-fail) 로더를 배선합니다.

1. 로컬 환경변수
   - 공개값 → `.envrc`
   - 비밀값 → `.envrc.local` + `.envrc.example` + 노션
2. fast-fail 배선
3. Terraform 적용
4. 노션 업데이트

### 프론트엔드 fast-fail

| 유형         | 설정 위치     | 접근           |
| ------------ | ------------- | -------------- |
| 앱 전용 변수 | `env.ts`      | `env.VAR_NAME` |
| 공통 스키마  | `validate.ts` | `env.VAR_NAME` |

클라이언트 번들에 포함되는 `NEXT_PUBLIC_*` 변수의 경우 fast-fail을 배선하지 않고, `process.env` 객체로 직접 접근합니다.

### 백엔드 fast-fail

1. `application.yaml` 파일에 변수 추가
2. `@ConfigurationProperties` 레코드 생성
   - 일부 환경에서만 쓰는 값은 `@Profile`를 선언한다
3. 레코드 객체를 통해 변수에 접근

## 인프라 환경변수

## TWA 환경변수

| 변수                    | 설명             |
| ----------------------- | ---------------- |
| `TWA_KEYSTORE_PASSWORD` | 키스톤 비밀번호  |
| `TWA_KEY_PASSWORD`      | 서명 키 비밀번호 |

- 키스토어 파일은 레포 밖 보관본을 `apps/career/android-twa/` 로 복사합니다

## GitHub Actions 환경변수

GitHub GUI에서 수동에서 관리합니다. 비밀값은 노션 참조

| 변수                           | 종류     | 사용 워크플로                            |
| ------------------------------ | -------- | ---------------------------------------- |
| `AWS_ACCESS_KEY_ID`            | secret   | db-backup                                |
| `AWS_SECRET_ACCESS_KEY`        | secret   | db-backup                                |
| `S3_BUCKET_NAME`               | secret   | db-backup                                |
| `DATABASE_URL`                 | secret   | db-backup, one-click-sync                |
| `DATA_GO_SERVICE_KEY`          | secret   | ci, one-click-sync                       |
| `SENTRY_AUTH_TOKEN`            | secret   | ci                                       |
| `FIGMA_ACCESS_TOKEN`           | secret   | figma-mapping                            |
| `VERCEL_TOKEN`                 | secret   | vercel-deploy                            |
| `SLACK_WEBHOOK_URL`            | secret   | one-click-sync                           |
| `SLACK_MONITORING_WEBHOOK_URL` | secret   | db-backup, one-click-sync, vercel-deploy |
| `CWMA_CSV_URL`                 | variable | one-click-sync                           |

- `GITHUB_TOKEN` 은 GitHub Actions에서 발급하므로 등록 대상이 아닙니다

## 참조

- TODO write-docs 링크
- [환경변수](https://www.notion.so/morton-so/384965d2888b8092be18f7bab46d0f8d)
