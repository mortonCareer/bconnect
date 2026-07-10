# 테스트 구조
- 위치 : 전체
- 범위 : API · 통합 테스트

## 테스트 유형
| 유형            | 범위                     | 라이브러리                          |
|---------------|------------------------|--------------------------------|
| API 테스트 및 문서화 | Controller             | Bruno                          |
| 통합 테스트        | Service (+ Repository) | JUnit, TestContainer           |
- 행위 클래스별 단위 테스트는 생략합니다
- 시드 데이터를 `data.sql`에 작성합니다

## Bruno 테스트
- 위치 : `/bruno`
- 폴더명 : `<seq>-<domain>`
- 파일명 : `<seq>-<feature>`
- 태그
  - `seed` : 시드 데이터 소모 (`docs` 블록에 메모)
  - `chain` : 선행되어야 하는 테스트 목록 (`docs` 블록에 메모)
  - `idempotent` : 멱등성 만족
  - `ws` : WebSocket 테스트
- 웹소켓(STOMP)
  - GUI 수동 테스트 필요 (`bru run` 항상 실패)
  - 각 프레임은 raw NUL(0x00) 문자로 종료

### 테스트 그룹
| 그룹        | 폴더                                                                                                |
|-----------|---------------------------------------------------------------------------------------------------|
| 인증 · 회원   | 01-otp · 02-members · 03-profiles · 04-credentials                                                |
| 업체 · 프로젝트 | 05-companies · 06-projects · 07-company-tasks · 08-offers · 09-assignee-tasks · 10-project-drives |
| 작업        | 11-worker-tasks · 12-posts                                                                        |
| 동료        | 13-coworker-requests · 14-coworkers · 15-recommendations                                          |
| 채팅        | 16-group-chats · 17-direct-chats                                                                  |
| 드라이브     | 18-member-drives                                                                                  |
| 크롤링       | 90-crawling                                                                                       |
| 정리        | 99-cleanup                                                                                        |
- 그룹 간 `@chain` 의존을 금지합니다

## 통합 테스트
- `ReflectionTestUtils`을 사용하지 않습니다

## 시드 데이터
| 유형  | 범위        | 설명                        |
|-----|-----------|---------------------------|
| 시스템 | 0 ~ 99    | 비즈니스 필수 데이터 (e.g. SYSTEM) |
| 테스트 | 100 ~ 199 | 값 변경시 테스트 파손 주의           |
| 샘플  | 200 ~ 299 | UI · QA 데이터               |
