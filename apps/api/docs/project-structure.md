# 프로젝트 구조

## 범위
- 패키지 구조 (도메인 · 레이어)
- 공용 도메인 (Member · Profile · Attachment)

## 패키지 구조

```
to.bconnect.api
├── common                  # 공통 모듈
├── core                    # 비즈니스 코어
│   ├── presentation/v1     # Presentation 레이어
│   │   ├── request
│   │   └── response
│   └── domain              # Domain 레이어
│       ├── chat
│       └── ...
├── storage                 # Storage 레이어
├── security                # 인증 · 인가
│   └── member
├── support                 # 제3자 서비스
└── socket                  # 실시간 통신 (STOMP)
```
- 레이어드 아키텍처(layer-first) 구조를 따릅니다.
- 패키지의 의존성 규칙은 ArchUnit로 강제합니다.

```mermaid
flowchart TD
    socket --> core
    core --> security
    security --> storage
    security --> support
    storage --> common
```

## 레이어 구조

```mermaid
graph TD
  subgraph Presentation
    Controller
    DTO
  end
  subgraph Domain
    Service
    DomainObj
  end
  subgraph Storage
    Repository
    Entity
  end
  Controller --> Service
  DTO -->|toCommand / of| DomainObj
  Service --> Service
  Service --> Repository
```

| 레이어         | 패키지          | 행위 클래스     | 데이터 객체 | 변환 책임    | 도메인 교차                             |
|-------------|--------------|------------|--------|----------|------------------------------------|
| Presentation | `presentation` | Controller | DTO | DTO      | 허용 (Controller → Service)          |
| Domain      | `domain`    | Service    | Domain | Service  | 허용 (Service → Service, Repository) |
| Storage     | `storage`   | Repository | Entity |          | 비허용                                |

- 비즈니스 로직은 기본적으로 서비스 클래스에서 처리합니다.
  - 비즈니스 로직이 복잡한 경우 하위 컴포넌트를 생성합니다. (e.g. Finder, Validator, etc)
  - 하향식 도메인 교차는 모두 허용되며, 응집도에 따른 의존성을 고려해야 합니다.
- 메서드명은 기본적으로 **비즈니스 관점**에서 작성합니다. (e.g. listLatestAccepted x, listPublic o)
- 유효성 검사 위치
  - Java Bean Validation : DTO 필드
  - 비즈니스 로직 : DTO → Command 변환
  - DB 무효성 : Entity 필드

## 도메인 의존성

### 도메인 교차
공용 도메인을 제외한 도메인 간 교차

```mermaid
graph TD
  subgraph recommendation
    RecS[RecommendationService]
    RecRepo[(RecommendationRepository)]
  end
  subgraph coworker
    CowS[CoworkerService]
    CowRS[CoworkerRequestService]
    CowRepo[(CoworkerRepository)]
  end
  subgraph task
    TaskS[TaskService]
  end
  subgraph profile
    ProfQ[ProfileQueryService]
  end
  subgraph post
    PostRepo[(PostRepository)]
  end
  subgraph member
    MemRepo[(MemberRepository)]
  end

  RecS -->|isCoworker| CowS
  TaskS -->|isCoworker| CowS
  ProfQ -->|"countByMemberId(In)"| PostRepo
  ProfQ -->|"countByToId(In)AndVisibleTrue"| RecRepo
  ProfQ -->|"countByMemberId(In)"| CowRepo
  CowRS -->|existsById| MemRepo
```

### 공용 도메인

Member·Profile·Attachment는 여러 도메인에서 공유한다.

### Member

```mermaid
graph TD
  subgraph Presentation
    ChatC[ChatController]
    CowC[CoworkerController]
    CowRC[CoworkerRequestController]
    FeedC[FeedController]
    ProfC[ProfileController]
    RecC[RecommendationController]
  end
  subgraph Domain
    MemR[MemberResolver]
  end

  ChatC --> MemR
  CowC --> MemR
  CowRC --> MemR
  FeedC --> MemR
  ProfC --> MemR
  RecC --> MemR
  MemR --> Member["security.member"]
  MemR --> Repo["storage.member"]
```

### Profile

```mermaid
graph TD
  subgraph Presentation
    CowC[CoworkerController]
    CowRC[CoworkerRequestController]
    FeedC[FeedController]
    RecC[RecommendationController]
  end
  subgraph Domain
    ProfQ[ProfileQueryService]
  end
  subgraph Storage
    PostRepo[PostRepository]
    RecRepo[RecommendationRepository]
    CowRepo[CoworkerRepository]
  end

  CowC --> ProfQ
  CowRC --> ProfQ
  FeedC --> ProfQ
  RecC --> ProfQ
  ProfQ --> PostRepo
  ProfQ --> RecRepo
  ProfQ --> CowRepo
```
### Attachment

```mermaid
graph TD
  subgraph Presentation
    ChatC[ChatController]
    CredC[CredentialController]
    FeedC[FeedController]
  end
  subgraph Domain
    PostS[PostService]
    CredS[CredentialService]
  end
  subgraph Socket
    MsgC[MessageSocketController]
    MsgS[MessageSocketService]
  end
  subgraph Attachment["Attachment Domain"]
    AttQ[AttachmentQueryService]
    AttR[AttachmentResolver]
  end

  ChatC -->|resolveMap · url| AttR
  CredC -->|resolveMap · url| AttR
  FeedC -->|resolveMap · url| AttR
  MsgC -->|resolveMap · url| AttR
  MsgS -->|list| AttQ
  PostS -->|list| AttQ
  CredS -->|get| AttQ
```

고아 첨부 정리는 역방향 교차를 가진다. `AttachmentCleanupService`가 컨텍스트별 매핑 repository를 `AttachmentReferenceProvider`(storage fragment)로 수집해 참조 여부를 조회한다. 도메인별 참조 규칙을 attachment 도메인이 모르도록 분산해 OCP·DIP를 지킨다.

```mermaid
graph TD
  subgraph Attachment["Attachment Domain"]
    AttClean[AttachmentCleanupService]
  end
  subgraph Storage
    PostMapRepo[(PostAttachmentMappingRepository)]
    MsgMapRepo[(MessageAttachmentMappingRepository)]
    CredRepo[(CredentialRepository)]
    ProfRepo[(ProfileRepository)]
  end
  RefProv{{AttachmentReferenceProvider}}

  AttClean -->|referencedIds| RefProv
  PostMapRepo -.implements.-> RefProv
  MsgMapRepo -.implements.-> RefProv
  CredRepo -.implements.-> RefProv
  ProfRepo -.implements.-> RefProv
```

## 래퍼런스
- [Java Bean Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)