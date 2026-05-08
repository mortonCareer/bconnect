# ADR-0002: 단일 S3 버킷 + path prefix 격리

- **Status**: Accepted
- **Date**: 2026-04-17 (오프라인 합의), 2026-04-26 ([PR #227](https://github.com/mortonCareer/bconnect/pull/227) 머지)
- **Deciders**: @manamana32321 @fine-pine
- **Related**: [#174](https://github.com/mortonCareer/bconnect/issues/174), [PR #227](https://github.com/mortonCareer/bconnect/pull/227)

## Context

Sprint 2에서 파일 업로드 기능(프로필 이미지, 인증서, 게시글 첨부, 채팅 첨부, 동산보드판 저장소)이 다수 entity에 걸쳐 도입됨. 다음 요구가 충돌:

- **격리**: 권한별로 다른 entity 파일을 분리하고 싶음 (프로필 = 공개, 인증서 = 본인+어드민, 채팅 = 참여자, 저장소 = 권한 멤버)
- **운영 단순성**: 버킷 수가 늘어날수록 IAM 정책 / CF 배포 / 모니터링 비용 ↑
- **비용**: S3 + CloudFront는 버킷 수에 비례하는 부분 + 트래픽 기반 부분 혼합
- **MVP-3 동산보드판 확장 고려**: 새 entity가 더 추가될 예정

## Options

### Option 1: 단일 버킷 + path prefix + CF Behavior 분기

버킷 1개 (`static`). 경로로 entity / 컨텍스트 식별. CloudFront Behavior가 path 패턴별로 public/private 인증을 분기.

- **장점**:
  - 신규 entity 추가 시 prefix 추가만 — 인프라 변경 0
  - IAM 정책 단일 (Lambda 리사이즈, 백엔드 업로드 등)
  - 운영 도구 (CLI, 모니터링) 단일 컨텍스트
  - CF cache hit ratio ↑ (도메인 단일)
- **단점**:
  - 권한 격리는 CF Signed Cookie scope에 의존 — 정책 누락 시 cross-context leak 위험
  - 한 버킷 quota / 한 CF 배포의 fail blast radius 큼

### Option 2: 컨텍스트별 다중 버킷

`profiles`, `posts`, `credentials`, `chats`, `storage` 각각 별도 버킷 + 별도 CF 배포.

- **장점**:
  - 권한 격리 강함 (버킷 단위 IAM)
  - blast radius 작음 (한 버킷 장애 ≠ 전체 장애)
- **단점**:
  - 5개 버킷 + 5개 CF 배포 + 5개 도메인 SSL → 운영 부담 ↑↑
  - 신규 entity 추가 시 인프라 PR 필요
  - CF cache 분산 → cache hit ratio ↓
  - 비용 ↑ (배포당 고정 비용)

### Option 3: 환경별 다중 버킷

`static-dev`, `static-prod` 분리.

- **장점**: 환경 격리 강함
- **단점**: AWS 계정 분리(이미 별도 환경)와 중복. Morton은 단일 AWS 계정 + IAM role 분리로 환경 격리 → 버킷 분리는 redundant

## Decision

**Option 1 (단일 버킷 + path prefix + CF Behavior 분기)** 채택.

S3 경로:

```
/{context}/{contextId}/images/{size}/{imageId}   ← 이미지 (Lambda 리사이즈)
/{context}/{contextId}/files/{fileId}             ← 일반 파일

context: profiles, posts, credentials, chats, storage
size: o (original), m (medium 800px), s (small 400px)
```

CF 도메인: `static.bconnect.to` 단일.

권한 격리: CF Signed Cookie의 scope를 `/{context}/{contextId}/*` 단위로 발급. 백엔드가 권한 검증 후 cookie 발급.

근거:

- Morton 규모(MVP 단계)에서 운영 단순성이 격리 강도보다 우선
- Signed Cookie scope만 정확히 발급하면 path prefix 격리로 권한 충분
- 신규 entity가 빈번히 추가되는 단계 — 인프라 변경 0의 가치가 큼

## Consequences

- **좋은 결과**:
  - 신규 entity (예: 동산보드판 추가 카테고리) prefix만 정의해서 즉시 사용 가능
  - 운영 도구 / 알람 / 모니터링 단일 컨텍스트
  - CF 비용 / 관리 비용 최소화
- **나쁜 결과**:
  - Signed Cookie scope 발급 로직 누락 시 cross-context leak 위험 — 백엔드 권한 검증 코드 리뷰 강화 필요
  - 한 버킷 장애 시 모든 파일 기능 영향 (blast radius) — S3는 99.99% SLA이므로 수용 가능
- **중립적 결과**:
  - SSE-KMS는 일단 미적용 (S3 기본 SSE-S3만). 컴플라이언스 요구 발생 시 별도 ADR로 재검토
  - Vercel Image Optimization 미사용 — CF 직접 서빙. 정적 자산만 Next `<Image>` 허용

## Notes

- 데이터 모델: Storage / Attachment / 매핑 테이블 (post_attachments 등) — 메모리 [`project_file_infra.md`](../../../.claude/projects/...) 참조 (인프라 수정 시 함께 갱신)
- 업로드 플로우: `presign → S3 PUT → confirm` 공통 패턴
- 후속: KMS 도입 / 감사 로그 별도 테이블은 컴플라이언스 요구 시 검토
