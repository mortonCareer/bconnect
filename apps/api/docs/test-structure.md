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
  - `auth` : 인증 필요
  - `seed` : 시드 데이터 소모 (`docs` 블록에 메모)
