# KISCON 건설업체정보 API → Postgres 동기화

## 개요

data.go.kr의 "국토교통부 키스콘 건설업체정보 서비스" API를 주기적으로 크롤링하여
Railway Postgres에 저장하고, career 앱의 원클릭 조회에서 사업자등록번호로 건설업 면허
및 행정처분 이력을 조회한다.

### 배경

- 기존 KISCON S3 sync(상습체불/하도급)은 수십 건 규모 → JSON on S3로 충분
- 건설업체정보는 **25만건** 규모 → 인덱싱 필요 → Postgres 선택
- API는 사업자등록번호 검색을 지원하지 않음 → 전체 데이터 동기화 후 로컬 쿼리
- API 응답의 `ncrMasterNum`은 정수(예: `4448103773`), 저장 시 10자리 TEXT로 정규화 (앞자리 0 보존)

## 데이터 소스

| 오퍼레이션   | 엔드포인트                     | 건수  | 설명         |
| ------------ | ------------------------------ | ----- | ------------ |
| `GongsiReg`  | `/ConAdminInfoSvc1/GongsiReg`  | ~203K | 건설업체등록 |
| `GongsiAdmi` | `/ConAdminInfoSvc1/GongsiAdmi` | ~52K  | 행정처분     |

- Base URL: `https://apis.data.go.kr/1613000/ConAdminInfoSvc1`
- 인증: `serviceKey` query parameter (env: `KISCON_API_SERVICE_KEY`)
- 응답: JSON (`_type=json`)
- 제한: 개발계정 10,000 API 호출/일, 30 TPS (호출 횟수 기준, 레코드 수 아님)
- 필수 파라미터: `sDate`, `eDate` (공시기간, YYYYMMDD), `pageNo`, `numOfRows`
- 선택 파라미터: `ncrAreaName` (시도), `ncrAreaDetailName` (시군구)

### 후순위 오퍼레이션 (GitHub Issue로 관리)

| 오퍼레이션     | 건수  | 설명                                           |
| -------------- | ----- | ---------------------------------------------- |
| `GongsiRenew`  | ~369K | 등록기준사항신고                               |
| `GongsiCess`   | ~90K  | 폐업신고                                       |
| `GongsiTrans`  | ~5.5K | 양도신고                                       |
| `GongsiUnion`  | ~2.3K | 법인합병신고                                   |
| `GongsiInheri` | ~177  | 상속신고                                       |
| `GongsiAdmiPD` | -     | 행정처분 가처분 (GongsiAdmi의 ncrGsSeq로 조회) |

## 아키텍처

```text
┌─ Sync Job (GitHub Actions, self-hosted runner) ────┐
│                                                      │
│  data.go.kr API → 페이지 순회 → Railway Postgres    │
│  INSERT ... ON CONFLICT (ncr_gs_seq) DO UPDATE       │
│                                                      │
│  초기: 2003-01-01 ~ 현재 (1회)                       │
│  이후: 직전 1주일 증분 (매주 월요일)                   │
└──────────────────────────────────────────────────────┘
                         │
                  Railway Postgres
                  ├─ kiscon_registration (203K rows)
                  └─ kiscon_admin_penalty (52K rows)
                         │
┌─ Career App (Vercel) ────────────────────────────────┐
│                                                        │
│  postgres.js → SELECT WHERE biz_reg_no = $1           │
│  unstable_cache (1hr TTL) + React cache() dedup       │
└────────────────────────────────────────────────────────┘
```

## 테이블 스키마

### kiscon_registration

| 컬럼             | 타입                                 | 설명                           | API 필드            |
| ---------------- | ------------------------------------ | ------------------------------ | ------------------- |
| `ncr_gs_seq`     | `BIGINT PRIMARY KEY`                 | 공시일련번호 (유니크 ID)       | `ncrGsSeq`          |
| `biz_reg_no`     | `TEXT NOT NULL`                      | 사업자등록번호                 | `ncrMasterNum`      |
| `company_name`   | `TEXT`                               | 업체명                         | `ncrGsKname`        |
| `representative` | `TEXT`                               | 대표자                         | `ncrGsMaster`       |
| `trade_name`     | `TEXT`                               | 등록업종                       | `ncrItemName`       |
| `trade_reg_no`   | `TEXT`                               | 업종등록번호                   | `ncrItemregno`      |
| `address`        | `TEXT`                               | 소재지                         | `ncrGsAddr`         |
| `region`         | `TEXT`                               | 시도                           | `ncrAreaName`       |
| `region_detail`  | `TEXT`                               | 시군구                         | `ncrAreaDetailName` |
| `reg_date`       | `INTEGER`                            | 등록일자 (YYYYMMDD)            | `ncrGsDate`         |
| `announce_date`  | `INTEGER`                            | 공시일자 (YYYYMMDD)            | `ncrGsRegdate`      |
| `flag`           | `TEXT`                               | 공시구분 (신규/정정/변경/철회) | `ncrGsFlag`         |
| `phone`          | `TEXT`                               | 전화번호                       | `ncrOffTel`         |
| `synced_at`      | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | DB 삽입 시각                   | -                   |

```sql
CREATE INDEX idx_kiscon_reg_biz_no ON kiscon_registration (biz_reg_no);
```

### kiscon_admin_penalty

| 컬럼                | 타입                                 | 설명                  | API 필드            |
| ------------------- | ------------------------------------ | --------------------- | ------------------- |
| `ncr_gs_seq`        | `BIGINT PRIMARY KEY`                 | 공시일련번호          | `ncrGsSeq`          |
| `biz_reg_no`        | `TEXT NOT NULL`                      | 사업자등록번호        | `ncrMasterNum`      |
| `company_name`      | `TEXT`                               | 업체명                | `ncrAdmiKname`      |
| `representative`    | `TEXT`                               | 대표자                | `ncrAdmiMaster`     |
| `trade_name`        | `TEXT`                               | 처분업종              | `ncrItemName`       |
| `trade_reg_no`      | `TEXT`                               | 업종등록번호          | `ncrItemregno`      |
| `address`           | `TEXT`                               | 소재지                | `ncrAdmiAddr`       |
| `region`            | `TEXT`                               | 시도                  | `ncrAreaName`       |
| `region_detail`     | `TEXT`                               | 시군구                | `ncrAreaDetailName` |
| `penalty_type`      | `TEXT`                               | 행정처분명            | `ncrAdmiDename`     |
| `violation_content` | `TEXT`                               | 위반내용              | `ecodeAdmiCon`      |
| `violation_detail`  | `TEXT`                               | 위반내용(상세)        | `ncrAdmiReason`     |
| `penalty_ground`    | `TEXT`                               | 처분근거              | `ecodeAdmiGround`   |
| `fine_amount`       | `BIGINT DEFAULT 0`                   | 과징금                | `ncrAdmiFine`       |
| `penalty_amount`    | `BIGINT DEFAULT 0`                   | 과태료                | `ncrAdmiPenalty`    |
| `stop_start_date`   | `TEXT`                               | 영업정지시작일        | `ncrAdmiStopSdate`  |
| `stop_end_date`     | `TEXT`                               | 영업정지종료일        | `ncrAdmiStopEdate`  |
| `cancel_date`       | `TEXT`                               | 등록말소일            | `ncrAdmiCanceldate` |
| `correction`        | `TEXT`                               | 시정내용              | `ncrAdmiCorrect`    |
| `penalty_date`      | `INTEGER`                            | 처분일자 (YYYYMMDD)   | `ncrGsDate`         |
| `announce_date`     | `INTEGER`                            | 공시일자 (YYYYMMDD)   | `ncrGsRegdate`      |
| `flag`              | `TEXT`                               | 공시구분              | `ncrGsFlag`         |
| `phone`             | `TEXT`                               | 전화번호              | `ncrOffTel`         |
| `has_injunction`    | `TEXT`                               | 가처분 존재여부 (Y/N) | `ncrPdStatus`       |
| `synced_at`         | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | DB 삽입 시각          | -                   |

```sql
CREATE INDEX idx_kiscon_admi_biz_no ON kiscon_admin_penalty (biz_reg_no);
```

## Sync Job

### 스크립트

- 파일: `apps/career/scripts/kiscon-construction-sync.ts`
- 실행: `pnpm exec tsx scripts/kiscon-construction-sync.ts [--full]`
- DB 클라이언트: `postgres` (postgres.js)

### 동작 모드

| 모드        | 플래그   | sDate    | eDate | 용도      |
| ----------- | -------- | -------- | ----- | --------- |
| 증분 (기본) | 없음     | 7일 전   | 오늘  | 주간 크론 |
| 전체        | `--full` | 20030101 | 오늘  | 초기 로딩 |

### 로직

```text
1. DB 연결 (RAILWAY_DATABASE_URL)
2. 테이블 없으면 CREATE TABLE + INDEX
3. sDate/eDate 결정 (증분 or 전체)
4. GongsiReg 페이지 순회:
   a. numOfRows=1000, pageNo=1 → totalCount 확인
   b. 모든 페이지 순회 (100ms 딜레이, 30 TPS 준수)
   c. 페이지당 INSERT ... ON CONFLICT (ncr_gs_seq) DO UPDATE SET flag, announce_date
   d. 페이지 단위 retry (3회, exponential backoff)
   e. 진행률 로그: "GongsiReg: page 5/204 (2.5%)"
5. GongsiAdmi 동일하게 반복
6. 결과 요약 로그 (inserted/updated/total)
7. Slack 알림 (성공: 건수 요약 / 실패: 에러 내용)
8. DB 연결 종료
```

### API 호출 예산

| 모드        | GongsiReg | GongsiAdmi | 합계       |
| ----------- | --------- | ---------- | ---------- |
| 전체 (초기) | 204 calls | 53 calls   | ~257 calls |
| 증분 (주간) | 1-2 calls | 1-2 calls  | ~4 calls   |

일일 한도 10,000건 대비 여유.

### 워크플로우

- 파일: `.github/workflows/kiscon-construction-sync.yml`
- 스케줄: 매주 월요일 00:00 UTC (09:00 KST)
- 러너: `morton-runner` (self-hosted, ARC on k8s)
- 수동 실행: `workflow_dispatch` (full 옵션 지원)
- Slack 알림: 성공 시 건수 요약, 실패 시 에러 내용

### 환경변수 (GitHub Secrets)

| 변수                     | 용도                  |
| ------------------------ | --------------------- |
| `KISCON_API_SERVICE_KEY` | data.go.kr API 인증키 |
| `RAILWAY_DATABASE_URL`   | Postgres 연결 문자열  |

## Career App 클라이언트

### 파일

- `apps/career/src/app/one-click/_clients/kiscon-construction-client.ts`

### 함수

```typescript
// 건설업 면허 등록 조회
export async function fetchConstructionLicense(bizRegNo: string): Promise<KisconRegistrationItem[]>

// 행정처분 이력 조회
export async function fetchConstructionAdminPenalty(
  bizRegNo: string
): Promise<KisconAdminPenaltyItem[]>
```

### DB 연결

- 라이브러리: `postgres` (postgres.js)
- 환경변수: `RAILWAY_DATABASE_URL`
- 연결 옵션: `{ max: 3, idle_timeout: 10, max_lifetime: 60 * 5 }`
- 모듈 스코프에서 싱글턴 인스턴스 생성 (serverless 환경에 맞게 짧은 idle/lifetime)

### 캐싱

- `unstable_cache` (1hr TTL) — 기존 패턴과 동일
- React `cache()` — 요청 내 dedup

### fetch-business.ts 통합

- `PENDING_ITEMS`에서 `CONSTRUCTION_LICENSE` 제거
- `fetchConstructionLicenseItem(regNo)` 함수 추가
- KCOMWEL 결과 불필요 — 사업자번호로 직접 조회
- CheckItem 매핑: 등록 업종, 등록일, 업체명 표시
- 행정처분: 처분명, 과태료/과징금, 영업정지 기간 표시

## 인프라 변경

### Railway (Terraform)

`infra/railway/database.tf`에 TCP proxy (public networking) 설정 추가.
TCP proxy 연결은 TLS 필수 (`?sslmode=require` in connection string).

### 환경변수 추가

| 위치                | 변수                     | 용도              |
| ------------------- | ------------------------ | ----------------- |
| GitHub Secrets      | `KISCON_API_SERVICE_KEY` | sync job API 인증 |
| GitHub Secrets      | `RAILWAY_DATABASE_URL`   | sync job DB 연결  |
| Vercel env (career) | `RAILWAY_DATABASE_URL`   | career 앱 DB 연결 |

### 파일 목록

| 파일                                                                   | 변경 유형 | 설명                   |
| ---------------------------------------------------------------------- | --------- | ---------------------- |
| `apps/career/scripts/kiscon-construction-sync.ts`                      | 신규      | sync 스크립트          |
| `apps/career/src/app/one-click/_clients/kiscon-construction-client.ts` | 신규      | DB 조회 클라이언트     |
| `apps/career/src/app/one-click/_clients/types.ts`                      | 수정      | 타입 추가              |
| `apps/career/src/app/one-click/_clients/fetch-business.ts`             | 수정      | CheckItem 통합         |
| `.github/workflows/kiscon-construction-sync.yml`                       | 신규      | 크론 워크플로우        |
| `infra/railway/database.tf`                                            | 수정      | TCP proxy 활성화       |
| `apps/career/package.json`                                             | 수정      | `postgres` 의존성 추가 |

## GitHub Issues (후순위)

1. KISCON 건설업체 폐업신고 (`GongsiCess`) 동기화
2. KISCON 건설업체 등록기준사항신고 (`GongsiRenew`) 동기화
3. KISCON 건설업체 양도/합병/상속 동기화
4. KISCON 행정처분 가처분 (`GongsiAdmiPD`) 상세 연동
