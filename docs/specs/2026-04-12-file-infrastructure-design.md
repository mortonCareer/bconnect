# 파일 인프라 설계

**작성일**: 2026-04-12 (v2 업데이트: 2026-04-17)
**관련 이슈**: [mortonCareer/bconnect#174](https://github.com/mortonCareer/bconnect/issues/174)
**관련 디자인**: [MVP-2 동산보드판 (Figma)](https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB/?node-id=1143-793)
**관련 ERD**: [Attachment 엔티티 (FigJam)](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/?node-id=381-560)
**상태**: 오프라인 미팅(2026-04-17) 합의 완료

---

## 1. 목적과 범위

Morton 서비스 전반에서 사용될 **파일 저장·조회·권한 제어** 인프라를 설계한다. Sprint 2에서 도입되는 **메시지 첨부**, **자격증 서류**를 우선 구현하고, 이후 **동산보드판(Storage)**, **게시글(Post)**, **프로필** 등으로 확장한다.

### Sprint 2 구현 범위

- Attachment 엔티티 + 엔티티별 매핑 테이블
- Lambda 이미지 리사이즈 파이프라인
- CloudFront + Signed Cookie 기반 private 접근 제어
- CloudFront 기반 public 접근 (capability URL)

### 명시적 비범위

- 동산보드판 Board 엔티티 (별도 정의 예정)
- 바이러스 스캔 / 매직바이트 검증
- On-the-fly 이미지 변환
- 워터마킹
- SSE-KMS (법적 요구 시 도입)
- 감사 로그 신규 테이블 (기존 SessionEntity/BaseEntity/Credential 충분)

---

## 2. 핵심 설계 결정 요약

| 영역 | 결정 |
|---|---|
| 업로드 방식 | Presigned PUT URL |
| 업로드 플로우 | 2-step — `/presign` → S3 PUT → `/confirm` (단일 엔드포인트) |
| 리사이즈 | **Lambda** (S3 ObjectCreated 이벤트 트리거, 업계표준) |
| 사이즈 | `o` (original), `m` (medium 800px), `s` (small 400px) |
| 읽기 (private) | CloudFront + Signed Cookie, path 패턴 scope |
| 읽기 (public) | CloudFront (인증 없음, capability URL) |
| 버킷 | **`static` 단일 버킷**, `public/` + `private/` path 분리 |
| 도메인 | `static.bconnect.to` 단일 |
| DB 모델 | **Storage + Attachment + 엔티티별 매핑 테이블** (polymorphic 폐기) |
| 이미지 서빙 | `<img>` + CloudFront. Next.js `<Image>`는 정적 자산 전용 |
| 크론 | GitHub Actions → 내부 API |
| 암호화 | SSE-S3 기본. KMS는 법적 필요 시 |
| 감사 로그 | 기존 SessionEntity/BaseEntity/Credential 활용 (신규 테이블 없음) |
| MIME 검증 | FE에서 처리 (S3 `application/*` 와일드카드 미지원) |

---

## 3. 시스템 구성

### 3.1 버킷 구조

**`static` 단일 버킷**, path로 public/private 분리. CloudFront Behavior가 path 기반으로 인증 분기.

```
static/                                              ← 버킷 (단일)
├── public/                                          ← CF 인증 없이 접근
│   ├── profiles/{profileId}/images/{o,m,s}/{imageId}
│   ├── posts/{postId}/images/{o,m,s}/{imageId}
│   └── businesses/{businessId}/images/{o,m,s}/{imageId}
└── private/                                         ← CF Signed Cookie 필수
    ├── credentials/{credentialId}/files/{fileId}
    ├── chats/{chatId}/images/{o,m,s}/{imageId}
    ├── chats/{chatId}/files/{fileId}
    ├── storage/{storageId}/images/{o,m,s}/{imageId}
    └── storage/{storageId}/files/{fileId}
```

**경로 컨벤션:**
- `{context}/{contextId}/` — 권한 scope 단위. Signed Cookie는 이 prefix 기준으로 발급
- `images/{o,m,s}/` — 이미지는 사이즈 디렉토리 필수
  - `o` = original (무변환)
  - `m` = medium (긴변 800px, WebP)
  - `s` = small (긴변 400px, WebP)
- `files/` — 이미지가 아닌 파일 (리사이즈 불필요)
- `{imageId}`, `{fileId}` — UUID. 파일 내용 불변(immutable) → 캐시 1년 가능

**단일 버킷 이유**: 도메인·Terraform·IAM 관리 단순화. PublicAccessBlock은 버킷 단위지만, OAC + path별 Behavior로 실질적 분리 보장.

### 3.2 CloudFront 설정

단일 도메인 `static.bconnect.to`, path별 Behavior로 인증 분기.

| Path pattern | Signed Cookie | Cache-Control | 용도 |
|---|---|---|---|
| `/public/*` | 불필요 | `public, max-age=31536000, immutable` | 전체 공개 자원 |
| `/private/*` (또는 Default) | 필수 | `private, max-age=604800` | 권한 제한 자원 |

- **Origin**: `static` S3 버킷 (OAC)
- **ACM**: us-east-1 인증서
- **Key Group**: RSA 공개키 등록 (Signed Cookie 검증용). 개인키는 Spring 서버가 보관
- **Response Headers**: `Cross-Origin-Resource-Policy: cross-origin` 등 필요 시

### 3.3 IAM

기존 `morton-app-storage-user`의 정책을 확장:

- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket` on `static/*`
- presigned URL 서명: 로컬 crypto 연산 (추가 권한 불필요)
- CloudFront private key 서명: Spring 내부 crypto (추가 권한 불필요)
- OAC는 bucket policy로 분리 관리

Lambda 리사이즈 함수 전용 role:
- S3 GetObject/PutObject on `static/*/images/o/*`, `static/*/images/m/*`, `static/*/images/s/*`
- CloudWatch Logs

> **관리 방식**: 모든 IAM/S3/CloudFront/Lambda 리소스는 `infra/aws/` 하위 Terraform으로 선언적 관리. 콘솔 수동 수정 금지.

---

## 4. DB 스키마

### 4.1 Attachment

파일 메타데이터. 모든 파일의 기본 단위.

```sql
CREATE TABLE attachments (
  id               BIGSERIAL PRIMARY KEY,
  member_id        BIGINT NOT NULL REFERENCES members(id),  -- 업로더 (JWT에서)
  filename         VARCHAR(255) NOT NULL,                   -- 원본 파일명
  path             VARCHAR(500) NOT NULL UNIQUE,            -- S3 key (context/contextId 포함)
  content_type     VARCHAR(100) NOT NULL,                   -- MIME
  size             BIGINT NOT NULL,                         -- bytes
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | COMPLETED | FAILED
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMP                                -- soft delete
);

CREATE INDEX idx_attachments_member ON attachments (member_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_pending ON attachments (status, created_at) WHERE status = 'PENDING';
```

**Status 전이:**
```
  [presign]                      [confirm + HeadObject OK]
     │                                    │
     ▼                                    ▼
  PENDING ─────────────────────────→ COMPLETED
     │                                    │
     │ [confirm + HeadObject 404]         │ [soft delete]
     ▼                                    ▼
  FAILED                            (deleted_at set)
```

### 4.2 Storage

**동산보드판(Board) 등 폴더 성격의 컨테이너 전용**. Linux inode 모델 참조 — Storage = 디렉토리, Attachment = 파일.

```sql
CREATE TABLE storages (
  id           BIGSERIAL PRIMARY KEY,
  type         VARCHAR(20) NOT NULL,                    -- 'PROJECT' | 'MEMBER'
  project_id   BIGINT REFERENCES projects(id),
  member_id    BIGINT REFERENCES members(id),
  title        VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMP,

  CHECK (
    (type = 'PROJECT' AND project_id IS NOT NULL AND member_id IS NULL)
    OR
    (type = 'MEMBER'  AND member_id IS NOT NULL AND project_id IS NULL)
  )
);
```

**사용 범위**: 동산보드판 UI에서 보이는 폴더. 하위 폴더 없음 (1-depth flat).

**중요**: Post, Message, Credential, Profile은 Storage를 거치지 않는다. 각자 매핑 테이블로 Attachment에 직접 연결.

### 4.3 매핑 테이블 (엔티티별)

Polymorphic reference 패턴을 **폐기**하고 엔티티별 N:M 매핑 테이블 사용. DB FK 무결성 확보, cascade 삭제 자연스러움.

```sql
-- 동산보드판 / 개인 저장소
CREATE TABLE storage_attachments (
  storage_id     BIGINT NOT NULL REFERENCES storages(id),
  attachment_id  BIGINT NOT NULL REFERENCES attachments(id),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (storage_id, attachment_id)
);

-- 게시글 이미지
CREATE TABLE post_attachments (
  post_id        BIGINT NOT NULL REFERENCES posts(id),
  attachment_id  BIGINT NOT NULL REFERENCES attachments(id),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, attachment_id)
);

-- 메시지 첨부
CREATE TABLE message_attachments (
  message_id     BIGINT NOT NULL REFERENCES messages(id),
  attachment_id  BIGINT NOT NULL REFERENCES attachments(id),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, attachment_id)
);

-- 인증서 파일
CREATE TABLE credential_attachments (
  credential_id  BIGINT NOT NULL REFERENCES credentials(id),
  attachment_id  BIGINT NOT NULL REFERENCES attachments(id),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (credential_id, attachment_id)
);
```

**프로필 이미지**: Profile 테이블의 `picture_attachment_id` 단일 FK (N:M 불필요, 1:1 관계).

### 4.4 엔티티 관계 요약

```
                     ┌──→ storage_attachments    ─→ Attachment
                     │                             │
   Storage           │                             │ member_id FK
   (Board/Personal)  │                             │ path (S3 key)
     ↑ 폴더          │                             │ content_type
                     │                             │ size
   Post ──→ post_attachments ─→                    │ status
   Message ──→ message_attachments ─→              │
   Credential ──→ credential_attachments ─→        │
                                                   │
   Profile ──(picture_attachment_id FK)──→ ────────┘
```

---

## 5. 업로드 플로우

### 5.1 공통 2-step (`/presign` → `/confirm`)

모든 업로드는 단일 엔드포인트를 사용. context 정보는 BE가 요청 내부에서 처리.

```
[Client]                        [Spring]                         [S3]
   │                               │                               │
   │ 1. POST /api/v1/attachments/presign                          │
   │    body: { files: [{ filename, size, contentType, ...}] }   │
   │──────────────────────────→    │                               │
   │                               │ ① 권한 체크                    │
   │                               │ ② attachments INSERT (PENDING) │
   │                               │ ③ S3 key 생성, presigned URL  │
   │  ←────────────────────────    │                               │
   │  { items: [{ attachmentId,   │                               │
   │    uploadUrl }] }             │                               │
   │                               │                               │
   │ 2. PUT {uploadUrl}                                            │
   │───────────────────────────────────────────────────────────→ │
   │  ←─────────────────────────────────────── 200 OK ─────────  │
   │                               │                               │
   │           (S3 ObjectCreated 이벤트 → Lambda 리사이즈)          │
   │                               │                      ┌─→ /o/ │
   │                               │                  Lambda      │
   │                               │                      └─→ /m/, /s/ (생성)
   │                               │                               │
   │ 3. POST /api/v1/attachments/confirm                           │
   │    body: { attachmentIds: [...] }                             │
   │──────────────────────────→    │                               │
   │                               │ ④ S3 HeadObject ────────────→│
   │                               │  ←── 200 / 404 ───────────── │
   │                               │ ⑤ UPDATE status=COMPLETED     │
   │  ←────────────────────────    │                               │
   │  { items: [{ attachmentId,   │                               │
   │    status, path }] }          │                               │
```

### 5.2 시나리오별 엔티티 연결

업로드 자체는 위 2-step으로 통일. 엔티티 연결은 **별도 API 호출**로.

**(A) 엔티티 미생성 — 메시지, 저장소**
```
1. POST /attachments/presign
2. PUT S3
3. POST /attachments/confirm
4. POST /messages { content, attachmentIds: [...] }     # 메시지 생성 + 첨부 연결
   POST /storages/{storageId}/attachments { attachmentIds: [...] }  # 저장소에 추가
```

**(B) 엔티티 생성 — 게시글, 인증서**
```
1. POST /attachments/presign
2. PUT S3
3. POST /attachments/confirm
4. POST /posts { content, attachmentIds: [...] }
   POST /credentials { type, attachmentIds: [...] }
```

**(C) 엔티티 수정 — 프로필 이미지**
```
1. POST /attachments/presign
2. PUT S3
3. POST /attachments/confirm
4. PATCH /profiles/me { pictureAttachmentId }
```

**게시글 이미지 정책**: 수정 시 **추가 불가**. 기존 이미지 삭제 후 재등록만 허용.

### 5.3 Presign 요청 body

context 정보(어떤 엔티티에 붙을지)는 **Spring 내부에서 결정**. FE는 파일 메타만 전달.

```json
POST /api/v1/attachments/presign
{
  "files": [
    { "filename": "photo.jpg", "size": 2400000, "contentType": "image/jpeg" }
  ]
}
```

Spring은 요청 경로/세션 컨텍스트 기반으로 `path` 생성 (세부 결정은 BE 책임).

---

## 6. 조회 / 다운로드 플로우

### 6.1 Private 이미지 (Signed Cookie)

```
[Client]                       [Spring]                  [CloudFront]        [S3]
   │                              │                            │               │
   │ GET /api/v1/chat-rooms/{id}/messages                                       │
   │───────────────────────────→  │                            │               │
   │                              │ 권한 체크                  │               │
   │                              │ 메시지 + attachmentIds 조회│               │
   │                              │ Signed Cookie 발급         │               │
   │                              │  (Resource=static.bconnect.│               │
   │                              │   to/private/chats/42/*)   │               │
   │  ←───────────────────────    │                            │               │
   │  Set-Cookie: CloudFront-*   │                            │               │
   │  { messages: [{ attachmentIds: [...] }] }                 │               │
   │                              │                            │               │
   │ (FE가 path + size로 URL 조립)                                              │
   │ <img src="https://static.bconnect.to/private/chats/42/images/s/abc.webp"> │
   │───────────────────────────────────────────────────────→   │               │
   │                              │                            │ 쿠키 검증     │
   │                              │                            │ ──────────→   │
   │  ←─────────────────────────────────────── image bytes ────│               │
```

### 6.2 Signed Cookie 라이프사이클

- **발급 주체**: Spring (로컬 RSA 서명, AWS 호출 없음)
- **저장**: 브라우저 쿠키 (HttpOnly, Secure, SameSite=Lax)
- **검증**: CloudFront edge (Key Group 공개키로 서명 검증)
- **TTL**: 1시간 (슬라이딩 갱신 — 활동 중 매 API 응답에 Set-Cookie 재발급)
- **만료 시**: CF → `403 Forbidden` → 클라 fetch interceptor → `POST /api/v1/auth/refresh-cf-cookies` → 재시도

### 6.3 Signed Cookie Scope

Scope는 엔티티 ID가 경로에 포함되므로 prefix 와일드카드로 지정 가능.

```json
{
  "Statement": [{
    "Resource": "https://static.bconnect.to/private/chats/42/*",
    "Condition": { "DateLessThan": { "AWS:EpochTime": 1712700000 } }
  }]
}
```

여러 context 동시 접근 필요 시 Statement 배열로 발급. 단 쿠키 크기 4KB 제한 유의.

### 6.4 FE URL 조립 규칙

API는 `attachmentId` 목록만 반환. FE가 path + size 조합하여 URL 생성.

```typescript
// 사이즈 상수 (패키지 공유)
export const IMAGE_SIZES = ['o', 'm', 's'] as const;

// 조회 응답
{ message: { attachmentIds: ["abc-uuid"], ... } }

// 별도 조회 또는 응답 포함된 attachment 메타
{ attachmentId: "abc-uuid", path: "private/chats/42/images", ... }

// FE URL 조립
const CDN = "https://static.bconnect.to";
const thumbUrl = `${CDN}/${att.path}/s/${att.attachmentId}.webp`;
const mediumUrl = `${CDN}/${att.path}/m/${att.attachmentId}.webp`;
const originalUrl = `${CDN}/${att.path}/o/${att.attachmentId}.${ext}`;
```

**장점**: DB에 URL 저장 불필요. 사이즈 추가 시 FE 상수만 확장.

---

## 7. 권한 모델

### 7.1 Context별 권한

| context | Scope 기준 | Read 허용 | Write 허용 |
|---|---|---|---|
| `profiles` (public) | 전체 공개 | 누구나 | 본인 |
| `posts` (public) | 전체 공개 | 누구나 | 작성자 |
| `businesses` (public) | 전체 공개 | 누구나 | 업체 멤버 |
| `chats` | `chatId` | 채팅방 참여자 | 메시지 작성자 |
| `credentials` | `credentialId` | 본인 + 어드민 | 본인 |
| `storage` | `storageId` | 권한 보유 멤버 | 권한 보유 멤버 |

### 7.2 구현 원칙

- **API 권한 검증**: 기존 Spring 인프라 활용 (BE 담당, 별도 설계 불필요)
- **정적 파일 권한 검증**:
  - Private: Signed Cookie scope로 제한. Spring은 쿠키 발급 시점에 DB 조회로 권한 재확인
  - Public: 경로 자체가 public이므로 별도 검증 없음 (capability URL)
- **Signed Cookie 발급 시 권한 검증 필수**: 세션의 권한 범위가 변경될 수 있으므로 쿠키 발급 시마다 DB 조회

---

## 8. 제한 정책

### 8.1 파일 제한

| 항목 | 제한 |
|---|---|
| 단일 파일 크기 | 20 MB |
| 배치 업로드 수 | 50장/요청 |
| 총 스토리지 쿼터 | v1 제한 없음, 모니터링만 |

### 8.2 MIME 검증

S3 presigned PUT은 `Content-Type` 조건을 단일 문자열로만 지원 (`application/*` 와일드카드 미지원, [AWS SDK Java v2 #5980](https://github.com/aws/aws-sdk-java-v2/issues/5980)). 한컴·워드·한글 등 한국 문서 포맷은 MIME 케이스가 너무 다양해 완전 화이트리스트 불가능.

**전략**:
- **FE**: 확장자 기반 1차 검증 (예: `.hwp`, `.docx`, `.pdf`, `.jpg` 등)
- **BE (Spring)**: 거부 목록(실행파일 등) + 파일 크기 재검증 (confirm 시 S3 HeadObject)
- **매직바이트 검증**: v2+ Lambda 비동기 스캔으로 추후 도입

---

## 9. 운영 / 라이프사이클

### 9.1 크론 작업 (GitHub Actions)

```yaml
# .github/workflows/attachment-cleanup.yml
on:
  schedule:
    - cron: '0 18 * * *'  # 매일 03:00 KST
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://api.bconnect.to/api/v1/internal/attachments/cleanup \
            -H "X-Internal-Secret: ${{ secrets.INTERNAL_API_SECRET }}"
```

Spring의 `/api/v1/internal/*`는 `X-Internal-Secret` 헤더로 보호. 다중 컨테이너 환경에서도 GHA가 단일 실행을 보장.

| 작업 | 주기 | 대상 |
|---|---|---|
| PENDING 청소 | 매시 | `status='PENDING' AND created_at < NOW() - 24h` → soft delete |
| FAILED 보존 후 청소 | 매일 | `status='FAILED' AND created_at < NOW() - 7d` → soft delete |
| 물리 삭제 | 매일 | `deleted_at < NOW() - 30d` → S3 삭제 + DB 물리 삭제 |
| 고아 매핑 정리 | 주 1회 | 참조 대상 없는 매핑 row 정리 |

### 9.2 S3 버킷 설정

**`static`:**

- `PublicAccessBlockConfiguration`: 4개 플래그 전부 ON
- `ServerSideEncryption`: SSE-S3 기본 (KMS는 v2+)
- `Versioning`: 비활성 (비용, MVP)
- `BucketPolicy`: CloudFront OAC만 GetObject 허용
- `CORS` (presigned PUT 대상):
  - `AllowedMethods`: `PUT`
  - `AllowedOrigins`: `https://bconnect.to`, `https://plan.bconnect.to`
  - `AllowedHeaders`: `Content-Type`, `Content-Length`
  - `ExposeHeaders`: `ETag`
- `Lifecycle`:
  - `AbortIncompleteMultipartUpload`: 1일 후 정리 (S3 네이티브)

### 9.3 Lambda 리사이즈

**트리거**: S3 ObjectCreated 이벤트 (suffix `/images/o/*` 만)

**동작**:
1. 원본 파일 다운로드
2. Sharp(Node.js) 또는 Pillow(Python)로 리사이즈
3. WebP 변환
4. `/images/m/{id}.webp`, `/images/s/{id}.webp`로 업로드

**사이즈 기준**:
- `m` (medium): 긴변 800px, quality 80
- `s` (small): 긴변 400px, quality 70

**실패 처리**: CloudWatch Logs + Dead Letter Queue. Attachment status는 원본 업로드 완료 기준(`COMPLETED`)이므로 Lambda 실패해도 상태 유지 (원본은 있음). 재시도 가능.

**참고 자료**: [fine-pine S3 Lambda 리사이즈 가이드](https://finepine.notion.site/S3-1b38efefbaf8801095accfd9d3887c71)

---

## 10. 인증서 파일 정책

Credential은 제출/승인/거절/만료 흐름을 가지며, 파일 자체는 다음 정책을 따른다:

- **승인/거절 후**: `deleted_at` 세팅 (soft delete), 30일 후 물리 삭제
- **즉시 파기 아님**: 이의 제기 등 분쟁 가능 기간 확보
- **만료**: Credential 엔티티 자체에 `expired_at` 존재 (별도 관리)
- **감사 로그**: 기존 Credential 엔티티의 승인/거절 이력 + BaseEntity의 생성/수정 로그로 충분

v1에서 법적 요구(개인정보 2년 보관 등)가 명시되기 전까지 복잡한 감사 테이블은 도입하지 않는다.

---

## 11. 이미지 컴포넌트 정책

| 이미지 종류 | 출처 | 컴포넌트 |
|---|---|---|
| **S3 유저 업로드** (Attachment) | `static.bconnect.to` | `<img loading="lazy">` + aspect-ratio CSS |
| **정적 자산** (로고, 아이콘, 일러스트) | Vercel `/public/`, import | `<Image>` (Next.js) |

**왜 Next.js `<Image>`를 Attachment에 안 쓰나:**
- Vercel Image Optimizer의 서버사이드 fetch가 Signed Cookie를 못 가짐 → private 접근 불가
- Lambda가 이미 리사이즈·WebP 변환 완료 → 이중 처리 낭비
- CF 캐시 1개로 충분 → Vercel Edge + CF 2중 레이어 불필요

**CLS 방지**: `width`/`height` 속성 또는 `aspect-ratio` CSS로 레이아웃 고정.

---

## 12. 확장 경로

| 단계 | 트리거 | 추가 구성 |
|---|---|---|
| **v1 (현재)** | — | 위 설계 전부 |
| **v1.5** | Board 엔티티 정의 완료 | `storages` 통해 동산보드판 연동 |
| **v2** | 업로드 성공률 분석 필요 | S3 이벤트 → 업로드 완료 자동 confirm |
| **v2** | 악성 파일 우려 / 규모 확대 | Lambda 매직바이트 검증 + ClamAV 바이러스 스캔 |
| **v2** | 법적 보관 요구 발생 | SSE-KMS + `RetentionPolicy` 도입 |
| **v3** | 동적 사이즈 요구 | Lambda@Edge on-the-fly 리사이즈 |
| **v3** | 대용량 파일 (>100MB) | S3 Multipart Upload (resumable) |
| **v4** | 콜드 스토리지 최적화 | S3 Intelligent-Tiering |

**CloudFront Functions vs Lambda@Edge**:

| 항목 | CF Functions | Lambda@Edge |
|---|---|---|
| 언어 | JavaScript | Node.js, Python |
| 실행 위치 | 199+ POPs | 13+ Regional edges |
| 지연 | <1ms | 수십 ms |
| 메모리 | 2MB | 최대 10GB |
| 용도 | header 조작, URL rewrite | 이미지 리사이즈, S3 fetch |
| 비용 | 10배 저렴 | 표준 Lambda |

on-the-fly 리사이즈는 Lambda@Edge. Header 조작은 CF Functions.

---

## 13. 미결 / 후속 이슈

- **Board 엔티티 정의** — CEO 작업 후 Storage와 연결
- **이미지 사이즈 Figma 실측** — MVP-2 동산보드판 그리드/상세 뷰 치수 확인 후 400/800px 조정 필요 시 업데이트
- **Post 이미지 수정 UX 확정** — 삭제 + 재등록 플로우 UI 상세 (디자인 의존)

---

## 14. 참고 자료

- [이슈 #174](https://github.com/mortonCareer/bconnect/issues/174)
- [ERD Attachment 엔티티 (FigJam)](https://www.figma.com/board/AzZ7IkJOg1kRo6y7B7Ceyj/?node-id=381-560)
- [MVP-2 동산보드판 디자인 (Figma)](https://www.figma.com/design/iGTu8r553JZ7TZ5FVdxkoB/?node-id=1143-793)
- [CloudFront Signed Cookies 공식 문서](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-cookies.html)
- [Presigned URL 공식 문서](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [S3 Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [fine-pine S3 Lambda 리사이즈 가이드](https://finepine.notion.site/S3-1b38efefbaf8801095accfd9d3887c71)
- [fine-pine AWS 자격증 정리](https://finepine.notion.site/2048efefbaf8805c9698fc424c16285f?pvs=74)
- [Linux inode (참고)](https://man7.org/linux/man-pages/man7/inode.7.html)
- [AWS SDK Java v2 MIME wildcard 이슈 #5980](https://github.com/aws/aws-sdk-java-v2/issues/5980)
