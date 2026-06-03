# 테스트 구조

## 테스트 유형
| 유형            | 범위                    | 라이브러리                          |
|---------------|-----------------------|--------------------------------|
| API 테스트 및 문서화 | Controller            | Bruno                          |
| 통합 테스트        | Service (+Repository) | JUnit, TestContainer           |
- 별도의 단위 테스트는 생략합니다.
- `data.sql` 파일의 시드 데이터를 활용합니다.

## Bruno 테스트
- 위치 : `/bruno`
- 폴더명 : `<seq>-<domain>`
- 파일명 : `<seq>-<feature>`
- 태그
  - `seed` : 시드 데이터 소모 (`docs` 블록에 메모)
  - `ws` : WebSocket 테스트
- 웹소켓(STOMP)
  - GUI 수동 테스트 필요 (`bru run` 항상 실패)
  - 각 프레임은 raw NUL(0x00) 문자로 종료

## 통합 테스트
- `ReflectionTestUtils`을 사용하지 않는다