# 테스트 구조

## 테스트 유형
| 유형      | 범위         | 라이브러리  |
|---------|------------|--------|
| API 테스트 | Controller | Karate |
| 단위 테스트  | Service    | JUnit  |
- API 테스트로 통합 테스트를 대체합니다.
- Repository 단위 테스트는 생략합니다.

## 디렉토리 구조
```
core/src/test/java/
└── so/morton/api/
    ├── api/            # Karate API Test
    ├── domain/         # Spring Unit Test
    └── support/        # Helpers
```
- `data.sql` 파일의 시드 데이터를 활용합니다