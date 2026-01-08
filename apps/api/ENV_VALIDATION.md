# 환경 변수 검증

## 개요

Spring Boot 애플리케이션 시작 시점에 필수 환경 변수를 검증합니다.

## 필수 환경 변수

### Database

- `DATABASE_URL`: 데이터베이스 연결 URL
- `DATABASE_USERNAME`: 데이터베이스 사용자명
- `DATABASE_PASSWORD`: 데이터베이스 비밀번호

### AWS S3

- `AWS_ACCESS_KEY_ID`: AWS IAM 액세스 키 ID
- `AWS_SECRET_ACCESS_KEY`: AWS IAM 시크릿 액세스 키
- `AWS_REGION`: AWS 리전 (예: ap-northeast-2)
- `AWS_S3_BUCKET`: S3 버킷 이름

## 작동 방식

1. `@ConfigurationProperties`와 `@Validated`를 사용하여 환경 변수 바인딩 및 검증
2. 환경 변수가 누락되거나 빈 문자열인 경우 애플리케이션 시작 실패
3. `@NotBlank` 어노테이션으로 각 필드 검증

## 코드 구조

### [AppProperties.java](core/src/main/java/so/morton/api/config/AppProperties.java)

```java
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    @NotBlank(message = "DATABASE_URL is required")
    String databaseUrl,

    @NotBlank(message = "DATABASE_USERNAME is required")
    String databaseUsername,

    @NotBlank(message = "DATABASE_PASSWORD is required")
    String databasePassword,

    @NotBlank(message = "AWS_ACCESS_KEY_ID is required")
    String awsAccessKeyId,

    @NotBlank(message = "AWS_SECRET_ACCESS_KEY is required")
    String awsSecretAccessKey,

    @NotBlank(message = "AWS_REGION is required")
    String awsRegion,

    @NotBlank(message = "AWS_S3_BUCKET is required")
    String awsS3Bucket
) {}
```

### [application.yaml](core/src/main/resources/application.yaml)

```yaml
app:
  database-url: ${DATABASE_URL:}
  database-username: ${DATABASE_USERNAME:}
  database-password: ${DATABASE_PASSWORD:}
  aws-access-key-id: ${AWS_ACCESS_KEY_ID:}
  aws-secret-access-key: ${AWS_SECRET_ACCESS_KEY:}
  aws-region: ${AWS_REGION:}
  aws-s3-bucket: ${AWS_S3_BUCKET:}
```

`${ENV_VAR:}` 문법:
- 환경 변수가 설정되어 있으면 해당 값 사용
- 설정되어 있지 않으면 빈 문자열 사용
- 빈 문자열은 `@NotBlank` 검증에 의해 실패

## 테스트 방법

### 유닛 테스트
```bash
./gradlew :core:test --tests AppPropertiesTest
```

### 로컬 실행 (환경 변수 없이)
```bash
./gradlew :core:bootRun
```

예상 결과: 애플리케이션이 시작 실패하며 다음과 같은 에러 발생:
```
Binding validation errors on app
- Field error in object 'app' on field 'databaseUrl': rejected value [];
  codes [NotBlank.app.databaseUrl,...];
  default message [DATABASE_URL is required]
```

### 로컬 실행 (환경 변수 설정)

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/mydb
export DATABASE_USERNAME=myuser
export DATABASE_PASSWORD=mypass
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_REGION=ap-northeast-2
export AWS_S3_BUCKET=my-bucket
./gradlew :core:bootRun
```

예상 결과: 애플리케이션 정상 시작

## Railway 배포

Railway는 런타임에 환경 변수를 자동으로 주입하므로:

1. Railway Dashboard에서 환경 변수 설정
2. 빌드 및 배포 (환경 변수 불필요)
3. 런타임에 검증 수행

환경 변수가 누락된 경우 컨테이너가 시작 실패하며 Railway 로그에서 확인 가능합니다.

## 장점

✅ **즉시 실패 (Fail Fast)**: 잘못된 설정으로 애플리케이션이 부분적으로 실행되는 것을 방지
✅ **명확한 에러 메시지**: 어떤 환경 변수가 누락되었는지 정확히 알림
✅ **Type Safe**: `AppProperties`를 통해 타입 안전하게 환경 변수 접근
✅ **테스트 가능**: 유닛 테스트로 검증 로직 확인 가능
