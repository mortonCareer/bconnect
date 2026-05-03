# apps/api

Spring Boot 백엔드. 별도 Gradle 빌드 (pnpm 모노레포와 분리).

> 본 문서는 scaffold — BE owner(CEO)가 패턴/세부 보강 권장.

## Commands

```bash
cd apps/api && ./gradlew build         # 컴파일 + jar
cd apps/api && ./gradlew test          # 단위 테스트
cd apps/api && ./gradlew bootRun       # 로컬 실행 (http://localhost:8080)
cd apps/api && ./gradlew test --tests <ClassName>   # 특정 테스트만
```

## Patterns (BE)

- **API 응답 envelope**: `{ success, data/error }` 형식 일괄 적용 (root CLAUDE.md 참조)
- **API spec**: CTO가 `packages/api-client/src/spec/`에 작성 → 리뷰 후 BE 구현
- **Layered**: Controller → Service → Repository
- **Auth**: JWT, sub claim에 profileId 포함 ([#249](https://github.com/mortonCareer/bconnect/issues/249))
- **Migration**: Flyway (`db/migration/`) — main 머지 시 Railway 자동 실행
- **Profile**: `development` (로컬), `production` (Railway)

## 환경 변수

```yaml
# application.yml (env interpolation)
DATABASE_URL: jdbc:postgresql://...
JWT_SECRET: ***
SPRING_PROFILES_ACTIVE: development | production
```

## 배포

Railway 자동 배포 (main 브랜치 머지 → Docker 빌드 → Blue-Green). 자세히 [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md).