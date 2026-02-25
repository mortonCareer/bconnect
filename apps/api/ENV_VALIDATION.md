# 환경 변수 검증

## 개요

Spring Boot 애플리케이션 시작 시점에 필수 환경 변수를 검증합니다.
`Environment`를 직접 참조하여 환경 변수 이름 그대로 검증하므로 prefix 불일치 문제가 없습니다.

## 필수 환경 변수

### Database

- `DATABASE_URL`: 데이터베이스 연결 URL
- `DATABASE_USERNAME`: 데이터베이스 사용자명
- `DATABASE_PASSWORD`: 데이터베이스 비밀번호

### JWT

- `JWT_SECRET`: JWT 서명용 비밀 키

### AWS S3

- `AWS_ACCESS_KEY_ID`: AWS IAM 액세스 키 ID
- `AWS_SECRET_ACCESS_KEY`: AWS IAM 시크릿 액세스 키
- `AWS_REGION`: AWS 리전 (예: ap-northeast-2)
- `AWS_S3_BUCKET`: S3 버킷 이름

### CORS (선택)

- `CORS_ALLOWED_ORIGIN`: 허용할 Origin (기본값: `http://localhost:3000`)

## 작동 방식

### 환경 변수 검증 (`EnvironmentValidator`)

1. `Environment` 객체를 직접 주입하여 환경 변수를 이름 그대로 조회
2. `@PostConstruct`에서 누락된 변수가 있으면 `IllegalStateException`으로 즉시 실패
3. 검증 통과 시 마스킹된 값을 로그로 출력

### Properties 유효성 검증 (`AppProperties`)

1. `@ConfigurationProperties(prefix = "app")`로 YAML 바인딩
2. `@Validated` + Bean Validation으로 타입-세이프 검증
3. CORS: `@NotEmpty`로 `allowedOrigins`가 비어있지 않은지 검증
4. JWT: `@NotBlank` + `@Size(min = 32)`로 secret 필수 및 최소 길이(256-bit) 검증
5. JWT: `@NotNull`로 `accessTokenExpiration`, `refreshTokenExpiration` 필수 검증

## 코드 구조

### [EnvironmentValidator.java](core/src/main/java/so/morton/api/config/EnvironmentValidator.java)

```java
@Component
public class EnvironmentValidator {

    private static final List<String> REQUIRED_VARS = List.of(
            "DATABASE_URL",
            "DATABASE_USERNAME",
            "DATABASE_PASSWORD",
            "JWT_SECRET",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_REGION",
            "AWS_S3_BUCKET"
    );

    private final Environment env;

    @PostConstruct
    public void validate() {
        List<String> missing = REQUIRED_VARS.stream()
                .filter(var -> !StringUtils.hasText(env.getProperty(var)))
                .toList();

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "필수 환경변수가 설정되지 않았습니다: " + missing);
        }
        // 마스킹된 값 로그 출력
    }
}
```

### [AppProperties.java](core/src/main/java/so/morton/api/config/AppProperties.java)

```java
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    @Valid @NotNull Cors cors,
    @Valid @NotNull Jwt jwt
) {
    public record Cors(
        @NotEmpty(message = "app.cors.allowed-origins must not be empty")
        List<String> allowedOrigins,
        List<String> allowedOriginPatterns
    ) {}

    public record Jwt(
        @NotBlank(message = "app.jwt.secret must not be blank")
        @Size(min = 32, message = "app.jwt.secret must be at least 32 characters (256-bit for HMAC-SHA256)")
        String secret,
        @NotNull(message = "app.jwt.access-token-expiration must not be null")
        Duration accessTokenExpiration,
        @NotNull(message = "app.jwt.refresh-token-expiration must not be null")
        Duration refreshTokenExpiration
    ) {}
}
```

### application.yaml (관련 부분)

```yaml
spring:
  cloud:
    aws:
      region:
        static: ${AWS_REGION}
      credentials:
        access-key: ${AWS_ACCESS_KEY_ID}
        secret-key: ${AWS_SECRET_ACCESS_KEY}

app:
  cors:
    allowed-origins:
      - ${CORS_ALLOWED_ORIGIN:http://localhost:3000}
    allowed-origin-patterns:
      - https://morton-career*.vercel.app
      - https://morton-plan*.vercel.app
```

## 테스트 방법

### 로컬 실행 (환경 변수 없이)

```bash
./gradlew :core:bootRun
```

예상 결과: 애플리케이션이 시작 실패하며 다음과 같은 에러 발생:

```
java.lang.IllegalStateException: 필수 환경변수가 설정되지 않았습니다:
  [DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, JWT_SECRET,
   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET]
```

### 로컬 실행 (환경 변수 설정)

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/mydb
export DATABASE_USERNAME=myuser
export DATABASE_PASSWORD=mypass
export JWT_SECRET=my-super-secret-key-at-least-32-chars
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_REGION=ap-northeast-2
export AWS_S3_BUCKET=my-bucket
./gradlew :core:bootRun
```

예상 결과: 애플리케이션 정상 시작, 마스킹된 환경 변수 로그 출력

## Railway 배포

Railway는 런타임에 환경 변수를 자동으로 주입하므로:

1. Railway Dashboard에서 환경 변수 설정
2. 빌드 및 배포 (환경 변수 불필요)
3. 런타임에 검증 수행

환경 변수가 누락된 경우 컨테이너가 시작 실패하며 Railway 로그에서 확인 가능합니다.

## 장점

- **즉시 실패 (Fail Fast)**: 잘못된 설정으로 애플리케이션이 부분적으로 실행되는 것을 방지
- **명확한 에러 메시지**: 누락된 환경 변수 목록을 한번에 표시
- **Prefix 불일치 없음**: `Environment`를 직접 참조하여 환경 변수 이름 그대로 검증
- **CORS 검증**: `@NotEmpty`로 허용 Origin이 비어있지 않은지 보장
