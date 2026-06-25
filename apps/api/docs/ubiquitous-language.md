# 보편언어 (Ubiquitous Language)
- 위치 : 전체
- 범위 : 도메인 용어, Enum 값

## 도메인 개념

| 도메인           | 영문             | 국문     | 의미                       |
|---------------|----------------|--------|--------------------------|
| Member        | Member         | 회원     | 사용자                      |
| Auth          | Otp            | 인증코드   | 본인확인용 6자리 코드             |
| Auth          | SignupToken    | 가입 토큰  | 미가입자 회원가입용 임시 토큰         |
| Auth          | Session        | 세션     | 로그인 정보(IP, Agent 등)      |
| Auth          | Access Token   | 액세스 토큰 |                          |
| Auth          | Refresh Token  | 리프레시 토큰 |                          |
| Profile       | Profile        | 프로필    | 회원 프로필                   |
| Task          | Task           | 작업     | 프로젝트 공종별 작업 단위           |
| Post          | Post           | 게시글    |                          |
| Post          | Feed           | 피드     | 게시글 + 작성자 + 프로필 View     |
| Coworker      | Coworker       | 동료     | 동료 기술자                   |
| Coworker      | CoworkerRequest | 동료 요청  |                          |
| Recommendation | Recommendation | 추천     |                          |
| Chat          | Chat           | 채팅방    |                          |
| Chat          | Message        | 메시지    |                          |
| Chat          | Participant    | 참여자    | 채팅방-회원 매핑 정보             |
| Credential    | Credential     | 인증뱃지  |                          |
| Attachment    | Attachment     | 첨부     | 업로드 파일 메타데이터             |
| Attachment    | Signed cookie  |        | CloudFront 비공개 콘텐츠 열람 권한 |
| Company       | Company        | 인테리어 업체 |                          |
| Project       | Project        | 프로젝트   |                     |
| Offer         | Offer          | 제안     | 기술자 제안                   |
| Offer         | Offer          | 제안     | 기술자 제안                   |

## 열거형 (Enum)

### 회원(Member)

| 영문 | 국문     |
|---|--------|
| GUEST | 게스트    |
| CLIENT | 소비자    |
| ARCHITECT | 건축가    |
| CONTRACTOR | 인테리어 업체 |
| FOREMAN | 반장     |
| SKILLED | 기공     |
| SEMI_SKILLED | 준기공    |
| HELPER | 조공     |
| ADMIN | 어드민    |

### 프로필(Profile)

| 영문 | 국문   |
|---|------|
| DESIGN | 디자인  |
| DEMOLITION | 철거   |
| ELECTRICAL | 전기 설비 |
| PLUMBING | 배관   |
| MECHANICAL | 기계 설비 |
| MASONRY | 적조   |
| CARPENTRY | 목공   |
| GLAZING | 유리   |
| WATERPROOFING | 방수   |
| PLASTERING | 미장   |
| INSULATION | 단열   |
| TILING | 타일   |
| GROUTING | 줄눈   |
| PAINTING | 도장   |
| WALLPAPER | 도배   |
| FILM_SHEET | 필름/시트 |
| HARDWOOD | 마루   |
| VINYL | 장판   |
| SINK | 싱크대  |
| FURNITURE | 가구   |
| AIR_CONDITIONING | 냉난방  |
| HOISTING | 양중   |
| TRANSPORT | 운반   |
| CLEANING | 청소   |
| GENERAL_LABOR | 조공   |

### 작업(Task)

| 영문 | 국문 |
|---|---|
| WORKER | 기술자 |
| PROJECT | 프로젝트 |

### 작업 상태(TaskStatus)

| 영문 | 프로젝트(업체) | 기술자 |
|---|---|---|
| DRAFT | 시작 전 | 시작 전 |
| OPEN | 모집 중 | 지원 완료 |
| OFFERED | 섭외 중 | 제안 받음 |
| SCHEDULED | 섭외 됨 | 시공 전 |
| IN_PROGRESS | 진행 중 | 진행 중 |
| COMPLETED | 시공 완료 | 시공 완료 |

### 동료(Coworker)

| 영문 | 국문 |
|---|---|
| NONE | 관계없음 |
| SENT | 보낸 요청 |
| RECEIVED | 받은 요청 |
| COWORKER | 동료 |

### 채팅방(Chat)

| 영문 | 국문 |
|---|---|
| TEXT | 텍스트 |
| IMAGE | 이미지 |
| FILE | 파일 |
| SYSTEM | 시스템 |

### 인증뱃지(Credential)

| 영문 | 국문 |
|---|---|
| PENDING | 대기 |
| ACCEPTED | 승인 |
| DENIED | 반려 |

### 인증뱃지 유형(CredentialType)

| 영문 | 국문 |
|---|---|
| IDENTITY_VERIFICATION | 본인인증 |
| SOLE_PROPRIETOR | 개인사업자 |
| CONSTRUCTION_LICENSE | 건설업면허 |
| SPECIALTY_CONSTRUCTION_LICENSE | 전문건설업면허 |
| CAREER_CERTIFICATE | 경력증명서 |
| SKILL_GRADE_CERTIFICATE | 기능등급증명서 |
| OTHER_CERTIFICATE | 기타 증명서 |
| NATIONAL_TECHNICAL_QUALIFICATION | 국가기술자격 |
| SKILLED_TECHNICIAN | 숙련기술인 |
| OTHER_QUALIFICATION | 기타 자격증 |
