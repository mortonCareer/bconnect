# attachment-architecture
- 위치 : `/attachment`, `/storage/attachment`, `/core/domain`
- 범위 : 첨부파일(Attachment)

## 컴포넌트
- AttachmentKeyUtils : S3 object key 생성
- AttachmentResolver : Attachment 읽기 경로 조립
- AttachmentLinker : 도메인 ↔ Attachment 참조 연결 · 해제
- AttachmentQueryService : Attachment 조회 및 권한 검증
- AttachmentCleanupService : PENDING·고아 첨부 정리 (크론)
- S3FileStorage : presigned 로직 처리
- S3Presigner : AWS SDK presign (외부)
- S3Client : AWS SDK head·delete (외부)

## Key 생성 규칙

| 세그먼트 | context | contextId | type | size | uuid | ext |
|---|---|---|---|---|---|---|
| 의미 | 권한 scope | scope 식별자 | 파일 종류 | 이미지 사이즈 | 파일 식별자 | 확장자 |
| Enum | AttachmentContext | — | AttachmentType | ImageSize | — | — |
- `{context}/{contextId}/{type}/{size}/{uuid}.{ext}`

### Enum

| Enum | 레이어    | 값 (path/ext)                                                                 | 의미                   |
|---|--------|------------------------------------------------------------------------------|----------------------|
| AttachmentContext | Storage | `CHAT`(chats), `COMPANY`(companies), `CREDENTIAL`(credentials), `MEMBER`(members), `POST`(posts) | 권한 scope 종류 + path   |
| ReferenceType | Storage | `POST`, `MESSAGE`, `COMPANY`, `MEMBER`, `CREDENTIAL`                          | 엔티티 소유(참조)           |
| AttachmentType | Storage | `IMAGE`(images), `FILE`(files)                                               | 파일 종류 + path         |
| AttachmentStatus | Storage | `PENDING`, `COMPLETED`                                                       | 파일 업로드 상태            |
| ImageSize | Domain | `ORIGINAL`(o), `MEDIUM`(m/webp), `SMALL`(s/webp)                             | 이미지 사이즈 + path + ext |
- Context는 S3 저장 경로 · Signed Cookie 범위를 나타냄
- Reference는 DB 참조 · 도메인 소유를 나타냄


## Validator · Cleanup 구조

### Validator 구조

```mermaid
graph TD
    subgraph core.presentation
        Ctrl[AttachmentController]
    end
    subgraph attachment
        Service[AttachmentService]
    end
    subgraph core.domain
        ChatV[ChatAttachmentValidator]
        CompV[CompanyAttachmentValidator]
        CredV[CredentialAttachmentValidator]
        PostV[PostAttachmentValidator]
        ProfV[ProfileAttachmentValidator]
        Reg[AttachmentContextValidatorRegistry]
        V{{AttachmentContextValidator}}
    end
    Ctrl --> Reg
    Ctrl --> Service
    Reg --> V
    ChatV -.implements.-> V
    CompV -.implements.-> V
    CredV -.implements.-> V
    PostV -.implements.-> V
    ProfV -.implements.-> V
```
- AttachmentContextValidator : Context별 presign 권한 검증 인터페이스
- AttachmentContextValidatorRegistry : Validator 등록 · 위임

### Cleanup 구조
```mermaid
graph TD
    subgraph attachment
        Sched[AttachmentCleanupScheduler]
        Clean[AttachmentCleanupService]
    end
    subgraph storage
        AttR[("AttachmentRepository")]
    end
    Sched --> Clean
    Clean --> AttR
```
- Orphan 판정 : `referenceId is null`(도메인 미참조)인 COMPLETED Attachment

## Life cycle

| 단계              | 처리                                          | 상태        | DB       | S3          | 참조 |
|-----------------|---------------------------------------------|-----------|----------|-------------|----|
| presign         | 권한 검증 (ContextValidator) 후 presigned URL 발급 | PENDING   | ○        | -           | -  |
| upload          | 클라이언트가 presigned URL로 파일 업로드                | PENDING   | ○        | ○           | -  |
| confirm         | Attachment ↔ S3 head 일치 확인                  | COMPLETED | ○        | ○           | -  |
| create          | AttachmentLinker 검증 + referenceType·referenceId 세팅 | COMPLETED | ○        | ○           | ○  |
| read            | Resolver.url → CloudFront URL + Signe Cookie | COMPLETED | ○        | ○           | ○  |
| update · delete | Attachment 참조 교체 · 삭제                       | COMPLETED | ○        | ○           | ✕  |
| cleanup         | Cleanup 규칙에 따라 회수                           | -         | Soft Del | Hard Del | -  |


### Cleanup 규칙

| 대상 | 조건 | 의미                |
|---|---|-------------------|
| Pending | `status=PENDING` & `createdAt` 24h 경과 | presign 후 미confirm |
| Orphan | `status=COMPLETED` & `createdAt` 24h 경과 & `referenceId is null` | DB 삭제 후 S3 미삭제    |
