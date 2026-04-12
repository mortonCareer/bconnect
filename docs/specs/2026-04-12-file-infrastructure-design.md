# 파일 인프라 설계

**작성일**: 2026-04-12
**관련 이슈**: [mortonCareer/bconnect#174](https://github.com/mortonCareer/bconnect/issues/174)
**관련 디자인**: [MVP-2 동산보드판 (Figma)](https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB/?node-id=1143-793)
**관련 ERD**: [Attachment 엔티티 (FigJam)](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/?node-id=381-560)
**상태**: 승인됨 (설계)

---

## 1. 목적과 범위

Morton 서비스 전반에서 사용될 **파일 저장·조회·권한 제어** 인프라를 설계한다. Sprint 2에서 도입되는 **메시지 첨부**, **자격증 서류**를 우선 구현하고, 이후 **동산보드판**, **Post(피드)**, **프로필 사진** 등으로 확장한다.

### Sprint 2 구현 범위

- Attachment 엔티티 기반 저장소 (메시지 첨부, 자격증)
- Post 이미지 (public 버킷 경로, Attachment 엔티티 미사용)
- 프로필 아바타, 업체 로고 (public 버킷)
- 감사 로그 테이블 스키마 정의 (쓰기 구현은 v1.5)

### 명시적 비범위 (v1에서 다루지 않음)

- 동산보드판 Board 엔티티 (CEO 정의 예정, 2026-04-13 이후 별도 이슈)
- 사진 폴더/태그 분류 (Board 확정 후)
- 바이러스 스캔
- On-the-fly 이미지 리사이즈
- 워터마킹
- 감사 로그 쓰기 로직 (v1.5)

---

## 2. 핵심 설계 결정 요약

| 영역           | 결정                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| 업로드 방식    | **Presigned PUT URL** (클라이언트 → S3 직접)                                        |
| 업로드 플로우  | **2-step** — reserve → S3 PUT → confirm                                             |
| 리사이즈       | **클라이언트 업로드 시 3-size** (원본 + medium + thumb, WebP)                       |
| 읽기 (private) | **CloudFront + Signed Cookie** (reference 범위별 scope, slide TTL)                  |
| 읽기 (public)  | **CloudFront** (capability URL, 추측 불가한 UUID 경로)                              |
| 버킷 분리      | **morton-private** (신규) + **morton-public** (신규)                                |
| 도메인         | `cdn.bconnect.to` (private), `static.bconnect.to` (public)                          |
| DB 모델        | ERD의 **`attachments` 단일 테이블** + 다형적 참조(`reference_type`, `reference_id`) |
| 권한           | **per-`reference_type` 정책 함수** (Spring 도메인 서비스 위임)                      |
| Next.js Image  | public 이미지에만 사용, private은 `<img>` + CF signed cookie                        |
| 크론           | **GitHub Actions** → 내부 API 엔드포인트 호출                                       |
| 법적 보관 기간 | **Java enum `RetentionPolicy`** 코드로 관리                                         |

> 기존 `morton-storage` 버킷은 Sprint 2 구현 전에 **제거 예정** (현재 미사용).

---

## 3. 시스템 구성

### 3.1 버킷 구조

```
morton-private/                       (신규, private)
├── messages/{messageId}/{attId}/
│   ├── original.{ext}
│   ├── medium.webp
│   └── thumb.webp
├── credentials/{memberId}/{attId}/
│   ├── original.{ext}
│   └── thumb.webp
└── boards/{boardId}/{attId}/         (v2+, Board 엔티티 확정 후)
    └── ...

morton-public/                        (신규, public, OAC 경유)
├── posts/{postId}/{imageId}/
│   ├── original.{ext}
│   ├── medium.webp
│   └── thumb.webp
├── profiles/{memberId}/avatar.{ext}
└── businesses/{businessId}/logo.{ext}
```

**버킷 분리 이유**: 보안 설정을 다르게 가져감. private 버킷은 `BlockPublicAccess` 전부 ON, OAC로만 접근. public 버킷도 OAC 경유로 제한해 직접 접근 차단. 한쪽의 misconfiguration이 다른 쪽으로 번지지 않는다.

**버킷 이름 가용성 확인 완료** (2026-04-12): `morton-private`, `morton-public` 둘 다 미선점.

### 3.2 CloudFront 배포

| 도메인               | Origin               | 인증                          | 용도             |
| -------------------- | -------------------- | ----------------------------- | ---------------- |
| `cdn.bconnect.to`    | morton-private (OAC) | CloudFront Signed Cookie 필수 | 메시지/서류/보드 |
| `static.bconnect.to` | morton-public (OAC)  | 없음 (capability URL)         | Post/프로필/로고 |

- ACM 인증서: us-east-1 (CloudFront 요구사항)
- Cache policy: `Cache-Control: private, max-age=604800` (private), `public, max-age=31536000, immutable` (public)
- Cookie 서명용 RSA 키페어: AWS CloudFront Key Group + Public Key. 개인키는 Railway 환경변수 또는 SSM Parameter Store

### 3.3 IAM

기존 `morton-app-storage-user`의 정책을 확장:

- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket` (morton-private + morton-public)
- presigned URL 서명은 로컬 crypto 연산이라 S3 API 호출 아님 (추가 권한 불필요)
- CloudFront OAC는 bucket policy로 설정 (IAM 유저와 별개)
- CloudFront private key 서명: Spring 내부 crypto. AWS 권한 불필요.

> **관리 방식**: 모든 IAM/S3/CloudFront 리소스는 `infra/aws/` 하위 Terraform으로 선언적 관리. 콘솔 수동 수정 금지 (글로벌 규칙 "선언적 관리 원칙" 준수).

---

## 4. DB 스키마

### 4.1 `attachments` 테이블 (ERD 기반)

```sql
CREATE TABLE attachments (
  id                BIGSERIAL PRIMARY KEY,
  member_id         BIGINT NOT NULL REFERENCES members(id),  -- 업로더 (JWT에서)
  path              VARCHAR(500) NOT NULL UNIQUE,             -- S3 key
  type              VARCHAR(100) NOT NULL,                    -- MIME type
  size              BIGINT NOT NULL,                          -- bytes
  reference_id      BIGINT NOT NULL,                          -- 참조 대상 PK
  reference_type    VARCHAR(30) NOT NULL,                     -- EntityType enum

  -- 운영 필드 (ERD 기본형에 추가)
  status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  original_filename VARCHAR(255),
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMP                                 -- soft delete
);

CREATE INDEX idx_att_reference
  ON attachments (reference_type, reference_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_att_member
  ON attachments (member_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_att_pending_cleanup
  ON attachments (status, created_at)
  WHERE status = 'PENDING';
```

> BE 담당(CEO) PR 리뷰 필수.

### 4.2 Enum 값

**`AttachmentStatus`**

- `PENDING`: reserve 완료, S3 업로드 대기/진행 중. 서빙 제외.
- `READY`: confirm 완료, S3 객체 존재 확인. 서빙 가능.
- `FAILED`: confirm 시 S3 객체 없음 확인. 서빙 제외. 버그 추적·감사를 위해 **일정 기간 보존** (§9.1).

**상태 전이**

```
  [reserve]                         [confirm + HeadObject OK]
     │                                        │
     ▼                                        ▼
  PENDING ──────────────────────────────→ READY
     │                                        │
     │ [confirm + HeadObject 404]             │ [soft delete]
     ▼                                        ▼
  FAILED ──────────────→ (7일 후 soft delete → 30일 후 물리 삭제)
```

**`EntityType` (reference_type 값)**

v1:

- `MESSAGE` — 채팅 메시지 첨부
- `CREDENTIAL` — 자격증 서류

확장 예정:

- `BOARD` — 동산보드판 (Board 엔티티 정의 후)
- `RECOMMENDATION` — 추천 증빙
- 기타 필요 시 추가 (스키마 변경 없이 enum 값만 추가)

### 4.3 다형적 참조(polymorphic association) 트레이드오프

`reference_type` + `reference_id` 패턴은 **스키마 유연성과 DB 참조 무결성을 맞바꾸는 구조**다. 단점:

1. 외래키 제약 불가 (DB가 `reference_id`의 유효성 검증 못 함)
2. JOIN 시 `reference_type` 분기 필요
3. 참조 대상 삭제 시 cascade가 자동으로 안 됨

**완화 장치:**

- **도메인 서비스에서 명시적 cascade**: `MessageService.delete()`가 `attachmentService.deleteByReference(MESSAGE, id)` 호출
- **EntityType Java enum**: 문자열 직접 사용 금지, 타입 안전 확보
- **복합 인덱스** `(reference_type, reference_id)`: 쿼리 성능 보장
- **고아 레코드 크론 (주 1회)**: `reference_id`가 가리키는 대상이 없는 row는 soft delete

---

## 5. 업로드 플로우

### 5.1 2-step 플로우 (private 버킷)

```
[Client]                          [Spring]                  [S3]
   │                                 │                        │
   │ 1. POST /{resource}/{id}/attachments/reserve            │
   │    body: [{ filename, size, contentType }, ...]         │
   │──────────────────────────────→  │                        │
   │                                 │ ① 권한 체크 (도메인)   │
   │                                 │ ② attachments INSERT   │
   │                                 │    status=PENDING      │
   │                                 │ ③ Presigned PUT URL    │
   │                                 │    생성 (로컬 crypto)  │
   │ ←─────────────────────────────  │                        │
   │  { items: [{ id, uploadUrls:   │                        │
   │    { original, medium, thumb}}]}│                        │
   │                                 │                        │
   │ 2. PUT {uploadUrl} (3-size 각각, 병렬)                 │
   │───────────────────────────────────────────────────────→│
   │ ←──────────────────────────────────────── 200 OK ──────│
   │                                 │                        │
   │ 3. POST /{resource}/{id}/attachments/confirm            │
   │    body: [{ id: "..." }, ...]                            │
   │──────────────────────────────→  │                        │
   │                                 │ ④ S3 HeadObject       │
   │                                 │───────────────────────→│
   │                                 │ ←──── 200 / 404 ──────│
   │                                 │ ⑤ UPDATE status=READY │
   │                                 │    (또는 FAILED)      │
   │ ←─────────────────────────────  │                        │
   │  { items: [{ id, urls: {...}}]}│                        │
```

### 5.2 엔드포인트 설계 원칙

- `reference_type`은 **엔드포인트 URL에서 고정** (예: `/chat-messages/{id}/attachments` → MESSAGE)
- `reference_id`는 **URL path parameter**에서
- `member_id`는 **JWT subject**에서
- 요청 body는 **파일 메타만** (filename, size, contentType) — 신뢰 경계 최소화

예시:

```
POST /api/v1/chat-messages/{messageId}/attachments/reserve
POST /api/v1/chat-messages/{messageId}/attachments/confirm
POST /api/v1/credentials/{credentialId}/attachments/reserve
POST /api/v1/credentials/{credentialId}/attachments/confirm
```

> 현재 `packages/api-client/src/openapi.yaml`에 attachment 관련 엔드포인트 없음. 신규 작성.

### 5.3 클라이언트 리사이즈

업로드 전 브라우저/모바일에서 3-size 생성 후 각각 presigned URL로 업로드.

- **원본**: 무변환 (확장자 유지)
- **medium**: 긴변 800px, WebP 변환, quality 80
- **thumb**: 긴변 400px, WebP 변환, quality 70

`canvas.toBlob('image/webp', 0.8)` 기반 구현. HEIC는 서버 또는 `heic2any` 라이브러리로 JPEG 선변환 후 리사이즈.

**사이즈 상수화**: 관례 기준(업계 MVP 표준)으로 설정. Figma 실제 치수 확정 후 조정 가능하도록 한 곳에서 관리.

```typescript
// packages/config/image-sizes.ts
export const IMAGE_SIZES = {
  thumb: { maxDim: 400, quality: 70 },
  medium: { maxDim: 800, quality: 80 },
  original: null,
} as const
```

### 5.4 배치 처리

reserve/confirm 모두 배열 입력을 받아 한 번에 N개 처리 → 20장 업로드 시 API 호출 = reserve 1회 + S3 PUT (20 × 3 = 60회, 병렬) + confirm 1회.

### 5.5 Post 이미지 (public 버킷, Attachment 미사용)

Attachment 엔티티 거치지 않고 Post 테이블의 `images: String[]` 필드에 CDN URL 직접 저장.

```
POST /api/v1/posts/{postId}/images/upload-url
  → presigned PUT URL 반환 (3-size)
PUT {uploadUrl} → S3
POST /api/v1/posts/{postId}/images/confirm
  → posts.images 배열에 URL 추가
```

**미래 시나리오 (비공개 전환):** 기술자가 프로필 비공개 전환 기능 도입 시, Post 이미지도 `morton-private`으로 마이그레이션 필요. 구현 규모: 데이터 복사 + `Post.images: String[]` → `attachments` 레코드 이관 + URL 참조 업데이트. 대략 **반나절~하루 작업**. 지금 오버엔지니어링 안 함.

---

## 6. 조회 / 다운로드 플로우

### 6.1 private 이미지 (CloudFront Signed Cookie)

```
[Client]                         [Spring]               [CloudFront]          [S3]
   │                                │                          │                │
   │ GET /api/v1/chat-rooms/{id}/messages                                         │
   │───────────────────────────────→│                          │                │
   │                                │ 권한 체크                │                │
   │                                │ 메시지 + 첨부 조회        │                │
   │                                │ CF Signed Cookie 발급    │                │
   │                                │  (Resource=cdn.bconnect.to/messages/*,   │
   │                                │   Expires=1h)            │                │
   │ ←─────────────────────────────│                          │                │
   │  Set-Cookie: CloudFront-*       │                          │                │
   │  { messages: [{ id, attachments: [{ urls:{...} }]}] }     │                │
   │                                │                          │                │
   │ <img src="https://cdn.bconnect.to/messages/7/abc/thumb.webp">              │
   │  (쿠키 자동 포함)                                                            │
   │────────────────────────────────────────────────────────→│                │
   │                                │                          │ 쿠키 검증      │
   │                                │                          │ 캐시 miss → S3│
   │                                │                          │──────────────→│
   │                                │                          │ ←───────────  │
   │ ←──────────────────────────────────────── image bytes ───│                │
```

### 6.2 Signed Cookie 라이프사이클

**발급 주체**: Spring (RSA 서명은 로컬 crypto 연산, AWS 호출 없음)
**저장 위치**: 브라우저 쿠키 저장소 (HttpOnly → JS 접근 불가)
**검증 주체**: CloudFront edge (공개키로 서명 검증)
**전송**: 브라우저가 매 요청 시 쿠키 자동 포함
**S3 관여도**: 없음 (CF 뒤에서 파일만 제공)

**발급 시점:**

- 로그인 시 기본 scope 쿠키 1회 발급 (범용)
- 리소스별 API 호출 시 Set-Cookie로 추가 발급 (예: 채팅방 진입 시 해당 방 scope 쿠키)
- **Slide TTL**: 활동 중엔 매 API 응답에 Set-Cookie 갱신 → 세션 유효하면 만료 안 됨. 비활동 1시간 후 만료.

**만료 시 재발급:**

- CF가 `403 Forbidden` 반환 (무효/만료 서명 쿠키 시 표준 응답) → 클라 fetch interceptor가 감지 → `POST /api/v1/auth/refresh-cf-cookies` 호출 → 재시도
- 또는 slide TTL로 선제 갱신

### 6.3 Signed Cookie Scope 제한 (AWS SDK 기능)

CloudFront 자체 기능(S3 SDK 아님). AWS SDK의 `CloudFrontUtilities`가 RSA 서명된 3개 쿠키 생성:

```
CloudFront-Policy:         base64(JSON policy)
CloudFront-Signature:      RSA 서명
CloudFront-Key-Pair-Id:    공개키 ID
```

**Policy JSON 예시:**

```json
{
  "Statement": [
    {
      "Resource": "https://cdn.bconnect.to/messages/42/*",
      "Condition": {
        "DateLessThan": { "AWS:EpochTime": 1712700000 }
      }
    }
  ]
}
```

`Resource`에 `*` 와일드카드 지원 → reference 단위 scope 가능. 여러 scope 동시 발급 시 Statement 배열로.

**TTL:**

- 일반 (메시지/보드): 1시간
- 인증 서류: **2-5분** (민감도 높음)

### 6.4 응답 구조

서버는 각 첨부에 대해 **3-size URL을 응답에 직접 포함** (URL은 영구 고정 경로):

```json
{
  "attachments": [
    {
      "id": 42,
      "filename": "photo.jpg",
      "size": 2400000,
      "type": "image/jpeg",
      "urls": {
        "original": "https://cdn.bconnect.to/messages/7/abc/original.jpg",
        "medium": "https://cdn.bconnect.to/messages/7/abc/medium.webp",
        "thumb": "https://cdn.bconnect.to/messages/7/abc/thumb.webp"
      }
    }
  ]
}
```

URL 자체는 immutable. 권한은 쿠키로 제어.

---

## 7. 권한 모델

### 7.1 원칙

- **DB가 진실의 원천**. S3/CF는 바이트 창고 + 전달 계층.
- **권한 검증은 Spring이 DB 보고 판단**. S3/CF는 쿠키 서명 유효성만 본다.
- **reference_type별 권한 정책 함수**로 분리. 각 도메인 서비스에 위임.

### 7.2 정책 함수

```java
public interface AttachmentAccessPolicy {
  boolean canRead(Member user, Attachment att);
  boolean canWrite(Member user, EntityType refType, Long refId);
  boolean canDelete(Member user, Attachment att);
}
```

**`canWrite`만 `(refType, refId)`를 받는 이유**: 업로드 시점엔 attachment row가 아직 없음. `canRead/canDelete`는 존재하는 attachment에 대해 호출하므로 객체 통째로 전달.

**v1 구현:**

| reference_type | canRead                   | canWrite      | canDelete            |
| -------------- | ------------------------- | ------------- | -------------------- |
| `MESSAGE`      | 채팅방 참여자 전원        | 메시지 작성자 | 메시지 작성자        |
| `CREDENTIAL`   | 본인 + 매칭된 업체 + 운영 | 본인          | 본인 + 운영          |
| `BOARD` (v2+)  | 보드 멤버                 | 보드 멤버     | 업로더 + 보드 소유자 |

**구현 패턴 (예):**

```java
boolean canRead(Member user, Attachment att) {
  return switch (att.referenceType) {
    case MESSAGE    -> chatRoomService.isParticipantOfMessage(user.id, att.referenceId);
    case CREDENTIAL -> user.id.equals(att.memberId)   // 본인 (업로더)
                    || user.role == Role.OPS
                    || matchingService.hasMatchWith(user.id, att.memberId);
    case BOARD      -> boardService.isMember(user.id, att.referenceId);
  };
}
```

**중요: 권한이 "여러 명 허용"이어도 ACL 레코드 만들지 않음.** 정책은 런타임 함수, DB에 첨부당 1 row만 유지. "방 참여자 전원"은 기존 `chat_participants` 테이블 조회로 계산.

### 7.3 인증 서류 특별 처리

| 항목                  | 설정                               |
| --------------------- | ---------------------------------- |
| Signed Cookie TTL     | 2-5분                              |
| S3 암호화             | SSE-KMS (전용 KMS 키)              |
| 감사 로그 테이블      | v1 스키마 정의, v1.5 쓰기 로직     |
| `Content-Disposition` | `inline` 고정 (다운로드 유도 억제) |

**SSE-S3 vs SSE-KMS 차이** (암호화 알고리즘 자체는 둘 다 AES-256):

| 항목            | SSE-S3                  | SSE-KMS                          |
| --------------- | ----------------------- | -------------------------------- |
| 암호화 알고리즘 | AES-256                 | AES-256                          |
| 데이터 키 관리  | S3가 자동               | KMS 키로 데이터 키 생성·암호화   |
| 키 접근 제어    | 없음 (S3 접근 = 복호화) | KMS IAM 정책으로 분리 제어       |
| 감사 로그       | S3 access log만         | **CloudTrail에 복호화 이벤트**   |
| 비용            | 무료                    | KMS 요청당 $0.03/10K + 키 저장비 |

KMS의 핵심 이점은 **"S3 접근 권한"과 "실제 복호화 권한"의 분리** + **감사 추적**. 민감 파일 보호에 적합.

**`Content-Disposition`**: HTTP 응답 헤더로 브라우저 처리 방식 지시. `inline` = 바로 표시, `attachment` = 다운로드 대화상자. S3 객체 메타로 세팅 또는 CF 응답 변형 주입. 스크린샷은 차단 불가 (완전 방지는 불가).

**감사 로그 스키마 (v1 정의, Railway Postgres 저장):**

```sql
CREATE TABLE credential_access_logs (
  id            BIGSERIAL PRIMARY KEY,
  viewer_id     BIGINT NOT NULL REFERENCES members(id),
  attachment_id BIGINT NOT NULL,
  action        VARCHAR(20) NOT NULL,  -- 'VIEW', 'DOWNLOAD', 'DELETE'
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cred_access_viewer ON credential_access_logs (viewer_id, created_at);
CREATE INDEX idx_cred_access_attachment ON credential_access_logs (attachment_id, created_at);
```

**한국 법적 근거**: 개인정보보호법 시행령 제30조 — 개인정보 처리 시스템 접속기록 **1년 이상 보관** (대량·민감정보 처리 시 **2년**). 자격증은 민감정보에 가까워 2년 이상 안전.

---

## 8. 제한 정책

### 8.1 파일 제한 (v1)

**MIME 화이트리스트 (전역, 엔드포인트 무관):**

```
이미지 (항상 허용):
  image/jpeg
  image/png
  image/webp
  image/heic            -- iOS 기본 포맷

문서 (CREDENTIAL 등 문서형 유즈케이스):
  application/pdf
  application/haansofthwp                             -- hwp
  application/vnd.hancom.hwp                          -- hwp 대체
  application/vnd.hancom.hwpx                         -- hwpx
  application/msword                                  -- doc
  application/vnd.openxmlformats-officedocument.wordprocessingml.document  -- docx
```

> 한국 시장 특성상 hwp/hwpx는 자격증 및 사업자 서류에서 흔히 사용됨.

| 항목             | 제한                                          |
| ---------------- | --------------------------------------------- |
| 단일 파일 크기   | 20 MB                                         |
| 배치 업로드 수   | 50장/요청 (reserve 1회)                       |
| 엔티티당 첨부 수 | 메시지 10개 / 자격증 10개 / 보드 500개 (soft) |
| 총 스토리지 쿼터 | v1 제한 없음, 모니터링만                      |

### 8.2 검증 위치

- **reserve 시 Spring**: MIME, size, 권한 검증 → presigned URL의 `Content-Type`, `Content-Length` 조건으로 클라 우회 방지
- **confirm 시 Spring**: S3 HeadObject로 실제 size/type 재검증. 불일치 시 FAILED 처리
- **매직바이트 검증**: 파일 첫 바이트로 실제 포맷 확인 (MIME은 클라가 위변조 가능). 예: JPEG는 `FF D8 FF`, PDF는 `%PDF`. v1에선 미구현, v2+ Lambda 비동기 스캔으로 도입.

---

## 9. 운영 / 라이프사이클

### 9.1 크론 작업 (GitHub Actions)

**이유**: 다중 컨테이너 운영 시 Spring `@Scheduled`는 중복 실행 위험 (Shedlock 등 부가 의존성 필요). Morton은 이미 [kiscon-sync](../../.github/workflows/kiscon-sync.yml) 등 GHA 크론 패턴 사용 중. 인프라 분리 + 단일 실행 보장.

**패턴:**

```yaml
# .github/workflows/attachment-cleanup.yml
on:
  schedule:
    - cron: '0 18 * * *' # 매일 03:00 KST
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://api.bconnect.to/api/v1/internal/attachments/cleanup \
            -H "X-Internal-Secret: ${{ secrets.INTERNAL_API_SECRET }}"
```

Spring은 `/api/v1/internal/*` 엔드포인트를 별도 인증(X-Internal-Secret)으로 보호.

| 작업                | 주기   | 대상                                                                              |
| ------------------- | ------ | --------------------------------------------------------------------------------- |
| PENDING 청소        | 매시   | `status='PENDING' AND created_at < NOW() - 24h` → soft delete (30일 후 물리 삭제) |
| FAILED 보존 후 청소 | 매일   | `status='FAILED' AND created_at < NOW() - 7d` → soft delete                       |
| 물리 삭제           | 매일   | `deleted_at < NOW() - 30d` → S3 삭제 + DB 물리 삭제                               |
| 고아 레코드 스캔    | 주 1회 | `reference_id` 가리키는 대상 없는 row → soft delete                               |
| 법적 보관 만료      | 매일   | `RetentionPolicy` 기반 자동 파기 (§10 참조)                                       |

### 9.2 S3 버킷 설정

**morton-private (신규):**

- `PublicAccessBlockConfiguration`: 4개 플래그 전부 ON
  - `BlockPublicAcls`: 공개 ACL 신규 적용 차단
  - `IgnorePublicAcls`: 기존 공개 ACL 무시
  - `BlockPublicPolicy`: 공개 bucket policy 신규 적용 차단
  - `RestrictPublicBuckets`: 기존 공개 policy 무시
- `ServerSideEncryption`: SSE-S3 기본, `credentials/*` prefix는 SSE-KMS
- `Versioning`: 비활성 (비용, MVP)
- `CORS`:
  - `AllowedMethods`: `PUT`
  - `AllowedOrigins`: `https://bconnect.to`, `https://plan.bconnect.to`
  - `AllowedHeaders`: `Content-Type`, `Content-Length` (presigned PUT preflight 통과용)
  - `ExposeHeaders`: `ETag`
- `BucketPolicy`: CloudFront OAC만 GetObject 허용

**morton-public (신규, OAC 경유):**

- `PublicAccessBlockConfiguration`: 4개 플래그 전부 ON
- `ServerSideEncryption`: SSE-S3
- `Versioning`: 비활성
- `BucketPolicy`: CloudFront OAC만 GetObject 허용 (직접 접근 차단, CF 경유만)
- `CORS` (두 개 rule로 분리 — S3 CORSRule은 atomic 단위라 method별 origin 스코프 분리 시 rule 분리 필수):
  - **Rule 1 (브라우저 직접 GET은 허용 안 함)**: 생략. GET 요청은 CloudFront 경유 (서버사이드 fetch, 브라우저 CORS 미관여).
  - **Rule 2 (presigned PUT)**:
    - `AllowedMethods`: `PUT`
    - `AllowedOrigins`: `https://bconnect.to`, `https://plan.bconnect.to`
    - `AllowedHeaders`: `Content-Type`, `Content-Length`
    - `ExposeHeaders`: `ETag`

### 9.3 S3 Lifecycle 보완

네이티브 lifecycle이 가능한 단순 TTL 작업은 S3에 위임 (비용·안정성). DB 상태 기반 로직만 크론으로.

| 작업                                    | 처리 주체                           |
| --------------------------------------- | ----------------------------------- |
| 불완전 multipart upload 정리 (1일 경과) | S3 `AbortIncompleteMultipartUpload` |
| PENDING/FAILED 판단 기반 삭제           | 크론 (DB 상태 필요)                 |
| soft-deleted 30일 경과 물리 삭제        | 크론                                |
| 스토리지 계층 전환 (IA, Glacier)        | v3+                                 |

**버저닝은 버킷 전체 단위만 가능** (폴더/prefix별 선택 불가). prefix별 필요 시 별도 버킷 분리 또는 lifecycle rule로 즉시 만료 처리.

---

## 10. 법적 보관 기간 관리

**Java enum으로 코드 관리** (DB config 아님 — 법 개정은 PR 리뷰 경로 마땅).

```java
public enum RetentionPolicy {
  MESSAGE_ATTACHMENT(Duration.ofDays(365)),
  CREDENTIAL(Duration.ofDays(90)),          // 탈퇴/삭제 후 90일
  BOARD_ATTACHMENT(Duration.ofDays(365 * 3)),
  CREDENTIAL_ACCESS_LOG(Duration.ofDays(365 * 2));  // 개보법 접속기록 2년

  private final Duration retention;
}
```

**참고 법령:**

- 개인정보보호법: 대량·민감정보 처리 시 접속기록 2년
- 전자상거래법: 분쟁 가능 기록 3년
- 부가가치세법: 세금계산서 5년

> 운영 정책 최종 확정은 법무 자문 후. 현재 값은 초안.

---

## 11. 확장 경로

| 단계          | 트리거                              | 추가 구성                                                                |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **v1 (현재)** | —                                   | 위 설계 전부                                                             |
| **v1.5**      | Board 엔티티 정의 (2026-04-13 이후) | `EntityType.BOARD` 추가, `board_attachment_meta(folder, caption)` 테이블 |
| **v1.5**      | 인증서류 운영 투입                  | 감사 로그 쓰기 로직 구현                                                 |
| **v2**        | 업로드 성공률 분석 필요             | S3 ObjectCreated 이벤트 → Lambda → confirm 대체                          |
| **v2**        | 악성 파일 우려 / 대규모             | Lambda 비동기 바이러스 스캔 + 매직바이트 검증 (ClamAV)                   |
| **v2**        | 기술자 프로필 비공개 기능 도입      | Post 이미지 → `morton-private` 마이그레이션 (반나절~하루)                |
| **v3**        | 동적 사이즈 요구 증가               | Lambda@Edge on-the-fly 리사이즈                                          |
| **v3**        | 대용량 파일 (>100MB)                | S3 Multipart Upload, Resumable                                           |
| **v4**        | 콜드 스토리지 최적화                | S3 Intelligent-Tiering, Glacier 이전                                     |

**CloudFront Functions vs Lambda@Edge** (v3 선택지):

| 항목      | CF Functions             | Lambda@Edge               |
| --------- | ------------------------ | ------------------------- |
| 언어      | JavaScript               | Node.js, Python           |
| 실행 위치 | 199+ POPs                | 13+ Regional edges        |
| 지연      | <1ms                     | 수십 ms                   |
| 메모리    | 2MB                      | 최대 10GB                 |
| 용도      | header 조작, URL rewrite | 이미지 리사이즈, S3 fetch |
| 비용      | 10배 저렴                | 표준 Lambda 가격          |

on-the-fly 이미지 리사이즈는 **Lambda@Edge 필수**. header 조작은 CF Functions.

---

## 12. 미결 / 후속 이슈

- **Board 엔티티 정의** — CEO(송목) 2026-04-13 이후 작업 예정. 이후 `EntityType.BOARD` 및 `board_attachment_meta` 추가
- **법적 보관 기간 최종 확정** — 법무 자문 후 `RetentionPolicy` 값 조정
- **이미지 사이즈 Figma 측정 후 조정** — MVP-2 동산보드판 그리드/상세 뷰 치수 확인 후 `IMAGE_SIZES` 업데이트
- **공개 포트폴리오 기능** — 제품 요구사항 확정 시 설계 재검토 (현재 미확정)

---

## 13. 참고 자료

- [이슈 #174](https://github.com/mortonCareer/bconnect/issues/174)
- [ERD Attachment 엔티티 (FigJam)](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/?node-id=381-560)
- [MVP-2 동산보드판 디자인 (Figma)](https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB/?node-id=1143-793)
- [CloudFront Signed Cookies 공식 문서](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-cookies.html)
- [Presigned URL 공식 문서](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [S3 Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [개인정보보호법 시행령 제30조](https://www.law.go.kr/LSW/lsInfoP.do?efYd=20231214&lsiSeq=253707)
