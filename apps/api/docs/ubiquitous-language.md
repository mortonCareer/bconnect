# 보편언어 (Ubiquitous Language)

## 범위
- 도메인 용어 (영문 · 국문)
- 열거형(Enum) 값

## 도메인 개념

| 도메인 | 영문 | 국문 | 의미 |
|---|---|---|---|
| Member | Member | 회원 | 플랫폼 사용자 |
| Auth | Otp | 인증코드 | 전화 본인확인용 6자리 코드 |
| Auth | SignupToken | 가입 토큰 | 미가입자 회원가입용 임시 토큰 |
| Auth | Session | 세션 | 회원당 단일 로그인 상태 |
| Auth | Access Token | 액세스 토큰 | API 인가용 단기 토큰 |
| Auth | Refresh Token | 리프레시 토큰 | 액세스 토큰 재발급용 토큰 |
| Profile | Profile | 프로필 | 회원의 기술자 프로필 |
| Task | Task | 일감 | 작업(현장) 단위 |
| Post | Post | 게시글 | |
| Post | Feed | 피드 | 게시글 + 작성자 + 프로필 조합 뷰 |
| Coworker | Coworker | 동료 | 상호 수락으로 맺어진 관계 |
| Coworker | CoworkerRequest | 동료 요청 | |
| Recommendation | Recommendation | 추천 | |
| Chat | Chat | 채팅방 | |
| Chat | Message | 메시지 | |
| Chat | Participant | 참여자 | 채팅방-회원 매핑 |
| Credential | Credential | 자격/증빙 | |
| Attachment | Attachment | 첨부 | 업로드 파일 메타데이터 |
| Attachment | presign | 사전서명 | 업로드용 URL 발급 |
| Attachment | confirm | 확정 | 업로드 검증 후 완료 처리 |
| Attachment | signed cookie | 서명 쿠키 | 비공개 콘텐츠 열람 권한 |
| Common | Address | 주소 | 우편번호·주소·위경도 묶음 |
| Common | ApiResponse | 응답 봉투 | `{ success, data/error }` 표준 응답 |
| Common | CursorPage | 커서 페이지 | 커서 기반 페이지네이션 |
| Common | OffsetPage | 오프셋 페이지 | 오프셋 기반 페이지네이션 |

## 열거형 (Enum)

### Member

| 영문 | 국문 |
|---|---|
| GUEST | 게스트 |
| CLIENT | 의뢰인* |
| ARCHITECT | 건축가* |
| CONTRACTOR | 시공사* |
| FOREMAN | 반장* |
| SKILLED | 숙련공* |
| SEMI_SKILLED | 반숙련공* |
| HELPER | 조공* |
| ADMIN | 관리자 |

### Profile

| 영문 | 국문 |
|---|---|
| DESIGN | 설계* |
| DEMOLITION | 철거* |
| ELECTRICAL | 전기* |
| PLUMBING | 배관* |
| MECHANICAL | 기계* |
| MASONRY | 조적* |
| CARPENTRY | 목공* |
| GLAZING | 유리* |
| WATERPROOFING | 방수* |
| PLASTERING | 미장* |
| INSULATION | 단열* |
| TILING | 타일* |
| GROUTING | 줄눈* |
| PAINTING | 도장* |
| WALLPAPER | 도배* |
| FILM_SHEET | 필름/시트* |
| HARDWOOD | 마루* |
| VINYL | 장판* |
| SINK | 싱크* |
| FURNITURE | 가구* |
| AIR_CONDITIONING | 냉난방* |
| HOISTING | 양중* |
| TRANSPORT | 운반* |
| CLEANING | 청소* |
| GENERAL_LABOR | 조공 |

### Coworker

| 영문 | 국문 |
|---|---|
| NONE | 관계없음 |
| SENT | 보낸 요청 |
| RECEIVED | 받은 요청 |
| COWORKER | 동료 |

### Credential

| 영문 | 국문 |
|---|---|
| PENDING | 대기 |
| ACCEPTED | 승인 |
| DENIED | 반려 |
