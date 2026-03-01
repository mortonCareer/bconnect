# Code Convention

> 본 프로젝트(`dev-practice-commerce`)의 코드베이스에서 도출된 패턴, 유형, 역할을 정리한 문서.
> 예시 코드는 동일한 패턴의 Java 코드로 작성.

---

## 1. 멀티 모듈 구조

### 1-1. 모듈 구성

```
dev-practice-commerce (root)
├── core/
│   ├── core-enum      — 열거형 전용 (의존성 없음)
│   └── core-api       — 컨트롤러, 서비스, 도메인 (bootJar 배포 단위)
├── storage/
│   └── db-core        — JPA 엔티티, 리포지토리
└── support/
    ├── logging        — Logback + Brave 분산 추적
    └── monitoring     — Actuator + Prometheus
```

### 1-2. 의존성 방향

```
core-api ──→ core-enum
         ──→ db-core ──→ core-enum
         ──→ logging
         ──→ monitoring
```

| 모듈 | 역할 | 주요 의존성 |
|------|------|------------|
| **core-enum** | 열거형 정의 | 없음 (독립) |
| **db-core** | JPA 엔티티/리포지토리 | `spring-boot-starter-data-jpa`, `core-enum` |
| **core-api** | 비즈니스 로직 + REST API | `spring-boot-starter-web`, 나머지 모든 모듈 |
| **logging** | 로깅 설정 | `micrometer-tracing-bridge-brave` |
| **monitoring** | 메트릭 수집 | `spring-boot-starter-actuator`, `micrometer-registry-prometheus` |

### 1-3. 빌드 규칙

| 규칙 | 설명 |
|------|------|
| **bootJar** | `core-api`만 `enabled = true`, 나머지 모듈은 `enabled = false` |
| **jar** | `core-api`만 `enabled = false`, 나머지 모듈은 `enabled = true` |

### 1-4. 예시 — build.gradle (core-api)

```java
// core-api/build.gradle
dependencies {
    implementation(project(":core:core-enum"));
    implementation(project(":storage:db-core"));
    implementation(project(":support:logging"));
    implementation(project(":support:monitoring"));
    implementation("org.springframework.boot:spring-boot-starter-web");
}
```

---

## 2. 공통 처리

### 2-1. 공통 엔티티 (BaseEntity)

모든 엔티티가 상속하는 `@MappedSuperclass` 기반 클래스.

| 필드 | 타입 | 접근 | 설명 |
|------|------|------|------|
| `id` | `Long` | val (읽기 전용) | `@GeneratedValue(IDENTITY)` |
| `status` | `EntityStatus` | private var | Soft Delete용 (`ACTIVE`/`DELETED`) |
| `createdAt` | `LocalDateTime` | val (읽기 전용) | `@CreationTimestamp` |
| `updatedAt` | `LocalDateTime` | val (읽기 전용) | `@UpdateTimestamp` |

| 메서드 | 반환 | 역할 |
|--------|------|------|
| `active()` | void | 상태를 `ACTIVE`로 복원 |
| `delete()` | void | 상태를 `DELETED`로 변경 (Soft Delete) |
| `isActive()` | boolean | `status == ACTIVE` |
| `isDeleted()` | boolean | `status == DELETED` |

```java
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR")
    private EntityStatus status = EntityStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt = LocalDateTime.MIN;

    @UpdateTimestamp
    private LocalDateTime updatedAt = LocalDateTime.MIN;

    public Long getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void active() { this.status = EntityStatus.ACTIVE; }
    public void delete() { this.status = EntityStatus.DELETED; }
    public boolean isActive() { return status == EntityStatus.ACTIVE; }
    public boolean isDeleted() { return status == EntityStatus.DELETED; }
}
```

### 2-2. 공통 응답 (ApiResponse)

모든 API의 공통 응답 래퍼. `companion object`의 팩토리 메서드를 통해서만 생성.

| 필드 | 타입 | 설명 |
|------|------|------|
| `result` | `ResultType` | `SUCCESS` / `ERROR` |
| `data` | `T?` | 성공 데이터 (nullable) |
| `error` | `ErrorMessage?` | 에러 상세 (nullable) |

```java
public class ApiResponse<T> {

    private final ResultType result;
    private final T data;
    private final ErrorMessage error;

    private ApiResponse(ResultType result, T data, ErrorMessage error) {
        this.result = result;
        this.data = data;
        this.error = error;
    }

    // 데이터 없는 성공 응답
    public static ApiResponse<Object> success() {
        return new ApiResponse<>(ResultType.SUCCESS, null, null);
    }

    // 데이터 있는 성공 응답
    public static <S> ApiResponse<S> success(S data) {
        return new ApiResponse<>(ResultType.SUCCESS, data, null);
    }

    // 에러 응답
    public static <S> ApiResponse<S> error(ErrorType errorType, Object errorData) {
        return new ApiResponse<>(ResultType.ERROR, null, new ErrorMessage(errorType, errorData));
    }
}
```

**페이지 응답:**

```java
// 커서 기반 페이지 응답 (Slice 기반 — 전체 카운트 없음)
public class PageResponse<T> {
    private final List<T> content;
    private final boolean hasNext;
}
```

### 2-3. 예외 처리

#### 구조

```
ErrorCode (enum)        — 코드 식별자 (E500, E400, E1000, ...)
    ↓ 참조
ErrorType (enum)        — 코드 + HTTP상태 + 메시지 + 로그레벨 묶음
    ↓ 참조
CoreException (class)   — RuntimeException 서브클래스
    ↓ 처리
ApiControllerAdvice     — @RestControllerAdvice 전역 핸들러
    ↓ 변환
ApiResponse.error()     — 통일된 에러 응답
```

#### ErrorCode — 네이밍 패턴

| 규칙 | 설명 |
|------|------|
| **네이밍** | `E{도메인번호}{순번}` — 공통은 `E5xx`/`E4xx`, 도메인은 `E{N}xxx` |
| **도메인 그룹** | 공통(`E5xx/E4xx`), 주문(`E1xxx`), 결제(`E2xxx`), 상품(`E3xxx`), 쿠폰(`E4xxx`), 소유쿠폰(`E5xxx`), 포인트(`E6xxx`), 리뷰(`E7xxx`) |
| **확장** | 새 도메인 추가 시 다음 번호 대역(`E8xxx`, `E9xxx`, ...) 할당 |
| **무결성** | `ErrorTypeTest`로 ErrorCode 중복/미사용 자동 검증 |

#### ErrorType — 4속성 묶음

```java
public enum ErrorType {
    DEFAULT_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.E500, "알 수 없는 오류", LogLevel.ERROR),
    NOT_FOUND_DATA(HttpStatus.BAD_REQUEST, ErrorCode.E401, "해당 데이터를 찾을 수 없습니다.", LogLevel.ERROR),
    PAYMENT_INVALID_STATE(HttpStatus.BAD_REQUEST, ErrorCode.E2000, "결제 상태가 유효하지 않습니다.", LogLevel.INFO);

    private final HttpStatus status;
    private final ErrorCode code;
    private final String message;
    private final LogLevel logLevel;    // 로그 심각도 결정
}
```

#### CoreException

```java
public class CoreException extends RuntimeException {
    private final ErrorType errorType;
    private final Object data;    // 부가 데이터 (nullable)

    public CoreException(ErrorType errorType) {
        super(errorType.getMessage());
        this.errorType = errorType;
        this.data = null;
    }
}
```

#### ApiControllerAdvice — 전역 예외 핸들러

```java
@RestControllerAdvice
public class ApiControllerAdvice {

    private static final Logger log = LoggerFactory.getLogger(ApiControllerAdvice.class);

    // 비즈니스 예외 → ErrorType의 logLevel에 따라 로그 레벨 분기
    @ExceptionHandler(CoreException.class)
    public ResponseEntity<ApiResponse<Object>> handleCoreException(CoreException e) {
        switch (e.getErrorType().getLogLevel()) {
            case ERROR -> log.error("CoreException : {}", e.getMessage(), e);
            case WARN  -> log.warn("CoreException : {}", e.getMessage(), e);
            default    -> log.info("CoreException : {}", e.getMessage(), e);
        }
        return ResponseEntity
            .status(e.getErrorType().getStatus())
            .body(ApiResponse.error(e.getErrorType(), e.getData()));
    }

    // 예상치 못한 예외 → 항상 ERROR + 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(Exception e) {
        log.error("Exception : {}", e.getMessage(), e);
        return ResponseEntity
            .status(ErrorType.DEFAULT_ERROR.getStatus())
            .body(ApiResponse.error(ErrorType.DEFAULT_ERROR, null));
    }
}
```

### 2-4. 로깅 / 모니터링

#### 로깅 (support:logging 모듈)

| 항목 | 설정 |
|------|------|
| **프레임워크** | Logback + SLF4J |
| **분산 추적** | Micrometer Tracing Bridge Brave (`traceId`, `spanId`) |
| **로그 패턴** | `HH:mm:ss.SSS|LEVEL|traceId,spanId|logger|message` |
| **프로파일별 설정** | `logback-local.xml`, `logback-dev.xml`, `logback-staging.xml`, `logback-live.xml` |
| **Live 환경** | Sentry Appender 추가 (`WARN` 이상 이벤트 전송) |

```xml
<!-- logback-local.xml 패턴 -->
<pattern>
  %d{HH:mm:ss.SSS}|%5p|%32X{traceId:-},%16X{spanId:-}|%-40.40logger{39}|%m%n
</pattern>
```

#### 모니터링 (support:monitoring 모듈)

| 항목 | 설정 |
|------|------|
| **Actuator** | `spring-boot-starter-actuator` |
| **Prometheus** | `micrometer-registry-prometheus` |
| **노출 엔드포인트** | `management.endpoints.web.exposure.include: prometheus` |
| **헬스체크** | `HealthController` → GET `/health` |

---

## 3. 엔티티

### 3-1. 인터페이스 (상속 구조)

```
BaseEntity (@MappedSuperclass)
    ├── id, status, createdAt, updatedAt
    ├── active(), delete(), isActive(), isDeleted()
    │
    ├── OrderEntity
    ├── OrderItemEntity
    ├── PaymentEntity
    ├── CancelEntity
    ├── ... (22개 전체)
```

**규칙**: 모든 엔티티는 반드시 `BaseEntity`를 상속.

### 3-2. 역할별 분류

| 역할 | 식별 기준 | 특징 | 예시 |
|------|-----------|------|------|
| **상태 머신** | `var state` + `@Enumerated` 상태 필드 + 전이 메서드 | 상태 변경만 허용, 필드 직접 수정 금지 | Order, Payment |
| **불변 레코드** | 모든 비즈니스 필드가 `val` (읽기 전용) | 생성 후 수정 없음, 이력/감사 추적용 | OrderItem, Cancel |
| **CRUD 대상** | 사용자 직접 생성/수정/삭제 가능 | Soft Delete + 재활성화 지원 | CartItem, Review |
| **Toggle** | 추가/제거 반복 동작 | Soft Delete + `active()` 재활성화 | Favorite |
| **잔액 관리** | 단일 수치 필드 갱신 | CREATE 1회 + UPDATE N회 | PointBalance |
| **마스터 데이터** | 어드민 전용 데이터, 사용자 API에서 READ-ONLY | 서비스에서 조회만, CUD 없음 | Product, Coupon |
| **배치 집계** | 배치 작업에서만 CRU | 실시간 API 없음 | Settlement |

### 3-3. 필드 패턴

| 패턴 | 키워드 | 설명 | 예시 |
|------|--------|------|------|
| **불변 필드** | `val` | 생성 시 설정, 이후 변경 불가 | `val userId: Long` |
| **변경 가능 필드** | `var ... protected set` | 엔티티 메서드로만 변경 가능 | `var state: OrderState` |
| **열거형 필드** | `@Enumerated(STRING)` | 모든 enum은 STRING 저장 | `@Enumerated(EnumType.STRING)` |
| **텍스트 필드** | `@Column(columnDefinition = "TEXT")` | 긴 문자열 | `review.content` |
| **nullable 필드** | `타입?` / 기본값 null | 선택적 필드 | `externalPaymentKey: String? = null` |

```java
@Entity
@Table(name = "`order`",
    indexes = @Index(name = "udx_order_key", columnList = "orderKey", unique = true))
public class OrderEntity extends BaseEntity {

    // 불변 필드 — 생성 후 변경 불가
    private final Long userId;
    private final String orderKey;
    private final String name;
    private final BigDecimal totalPrice;

    // 변경 가능 필드 — 메서드로만 수정 (protected set)
    @Enumerated(EnumType.STRING)
    private OrderState state;

    // 상태 전이 메서드 (검증 없음 — 서비스가 검증 담당)
    public void paid() { this.state = OrderState.PAID; }
    public void canceled() { this.state = OrderState.CANCELED; }
}
```

### 3-4. 인덱스 규칙

| 엔티티 | 인덱스 이름 | 컬럼 | 패턴 |
|--------|------------|------|------|
| OrderEntity | `udx_order_key` | `orderKey` | **외부 식별자 유니크** — 주문 조회 키 중복 방지 |
| PaymentEntity | `udx_order_id` | `orderId` | **FK 1:1 유니크** — 주문 당 하나의 결제 보장 |
| OwnedCouponEntity | `udx_owned_coupon` | `userId, couponId` | **복합 유니크** — 사용자별 쿠폰 중복 다운로드 방지 |
| ReviewEntity | `udx_user_review` | `userId, reviewKey` | **복합 유니크** — 사용자별 리뷰 대상 중복 방지 |
| SettlementEntity | `udx_settlement_merchant` | `settlementDate, merchantId` | **복합 유니크** — 일자별 가맹점 정산 중복 방지 |
| MerchantProductMappingEntity | `udx_merchant_product` | `merchantId, productId` | **복합 유니크** — 가맹점-상품 매핑 중복 방지 |

**규칙**:
- 인덱스 이름 접두사 `udx_` = Unique Index
- 비즈니스 유니크 제약은 항상 DB 인덱스로 보장
- 단일 컬럼: 외부 키/식별자 유니크 | 복합 컬럼: 관계 중복 방지

### 3-5. 기본값 계층

| 계층 | 위치 | 예시 |
|------|------|------|
| **1) 빌드 설정** | `gradle.properties` | `javaVersion=21`, `kotlinVersion=1.9.25` |
| **2) 애플리케이션 설정** | `application.yml` | DB 커넥션, JPA 설정 |
| **3) 엔티티 필드** | 생성자 기본값 | `state = PaymentState.READY`, `version = 0` |
| **4) BaseEntity** | 고정 기본값 | `status = ACTIVE`, `createdAt = MIN` |
| **5) 도메인 상수** | companion object | `PointAmount.PAYMENT`, `PointAmount.REVIEW` |
| **6) ErrorType** | enum 속성 | `logLevel = ERROR`, `status = BAD_REQUEST` |

### 3-6. 낙관적 잠금 (@Version)

```java
// OwnedCouponEntity, PointBalanceEntity — @Version 사용
@Entity
public class OwnedCouponEntity extends BaseEntity {
    // ...
    @Version
    private long version = 0;
}
```

**규칙**: `@Version`은 동시성 충돌이 발생할 수 있는 엔티티에만 선택적 적용 (현재 OwnedCoupon, PointBalance 해당).

---

## 4. 리포지토리

### 4-1. 인터페이스

모든 리포지토리는 `JpaRepository<XxxEntity, Long>`을 상속.

```java
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    // Spring Data 자동 쿼리
    Optional<OrderEntity> findByOrderKeyAndStateAndStatus(
        String orderKey, OrderState state, EntityStatus status);

    List<OrderEntity> findByUserIdAndStateAndStatusOrderByIdDesc(
        Long userId, OrderState state, EntityStatus status);
}
```

### 4-2. 역할

| 유형 | 설명 | 예시 |
|------|------|------|
| **단건 조회** | `findBy...(): Entity?` | `findByOrderKeyAndStateAndStatus()` |
| **목록 조회** | `findBy...(): List<Entity>` | `findByUserIdAndStatus()` |
| **페이징 조회** | `findBy...(pageable): Slice<Entity>` | `findByCategoryIdAndStatus(..., pageable)` |
| **집합 조회** | `findByIdIn...(): List<Entity>` | `findByIdInAndStatus(ids, status)` |
| **집계 조회** | `@Query` JPQL | `findSummary()`, `findApplicableCouponIds()` |

### 4-3. 쿼리 패턴

| 패턴 | 메서드 네이밍 | 설명 |
|------|-------------|------|
| **Spring Data 자동** | `findBy{Field}And{Field}` | 필드 조합으로 자동 생성 |
| **정렬** | `...OrderBy{Field}Desc` | 메서드명에 정렬 포함 |
| **Nullable 반환** | `...(): Entity?` | 단건 + 없을 수 있음 |
| **Slice 페이징** | `...(pageable: Pageable): Slice<Entity>` | 무한 스크롤 (COUNT 없음) |
| **JPQL 커스텀** | `@Query("SELECT ...")` | 복잡 조인, 서브쿼리, 집계 |

```java
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {

    // Spring Data 자동 쿼리
    List<OrderItemEntity> findByOrderId(Long orderId);
    List<OrderItemEntity> findByOrderIdIn(Collection<Long> orderIds);

    // JPQL 커스텀 쿼리
    @Query("""
        SELECT oi FROM OrderItemEntity oi
        JOIN OrderEntity o ON oi.orderId = o.id
        WHERE o.userId = :userId
          AND oi.productId = :productId
          AND o.state = :state
          AND o.createdAt >= :cutoff
          AND o.status = :status
        ORDER BY oi.id DESC
    """)
    List<OrderItemEntity> findRecentOrderItemsForProduct(
        @Param("userId") Long userId,
        @Param("productId") Long productId,
        @Param("state") OrderState state,
        @Param("cutoff") LocalDateTime cutoff,
        @Param("status") EntityStatus status);
}
```

### 4-4. 절대 안 하는 것

- ❌ `deleteById()` 호출 (Hard Delete) — Soft Delete만 사용
- ❌ 리포지토리에 비즈니스 로직 — 순수 데이터 접근만
- ❌ `Page<T>` 반환 (COUNT 포함) — `Slice<T>` 사용

---

## 5. 서비스

### 5-1. 인터페이스 (어노테이션)

| 어노테이션 | 용도 |
|-----------|------|
| `@Service` | Facade 서비스, 일반 서비스 |
| `@Component` | Finder, Manager, Handler, Validator 등 전문 역할 |

**규칙**: 서비스 인터페이스(`interface`)를 별도 정의하지 않음. 구체 클래스를 직접 주입.

### 5-2. 유형 (CQS 기반 역할 분리)

| 유형 | 접미사 | 역할 | @Transactional | 예시 |
|------|--------|------|---------------|------|
| **Facade** | `Service` | 여러 전문 서비스를 조합하는 진입점 | 선택적 | `ReviewService`, `ProductService` |
| **Finder** | `Finder` | 조회 전용 (Query) | 없음 | `ReviewFinder`, `ProductFinder` |
| **Manager** | `Manager` | 쓰기 전용 (Command) | ✅ | `ReviewManager` |
| **Handler** | `Handler` | 부수 효과 처리 | ✅ | `PointHandler` |
| **Validator** | `Validator` | 정책 검증 (읽기 + 판단) | 없음 | `ReviewPolicyValidator` |
| **Loader** | `Loader` | 배치 데이터 적재 | ✅ | `SettlementTargetLoader` |
| **단일 서비스** | `Service` | Facade 없이 단독 처리 | ✅ | `CartService`, `QnAService`, `CancelService` |

```java
// Facade 패턴 — ReviewService가 4개 전문 서비스를 조합
@Service
public class ReviewService {
    private final ReviewFinder reviewFinder;        // 조회
    private final ReviewManager reviewManager;      // 쓰기
    private final ReviewPolicyValidator validator;  // 검증
    private final PointHandler pointHandler;        // 부수효과

    public Long addReview(User user, ReviewTarget target, ReviewContent content) {
        ReviewKey key = validator.validateNew(user, target);   // 정책 검증
        Long reviewId = reviewManager.add(key, target, content); // 저장
        pointHandler.earn(user, PointType.REVIEW, reviewId, PointAmount.REVIEW); // 포인트
        return reviewId;
    }
}
```

```java
// 단일 서비스 — CartService가 직접 Repository 사용
@Service
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Long addCartItem(User user, AddCartItem item) {
        // 서비스가 검증, 엔티티는 실행만
        CartItemEntity existing = cartItemRepository
            .findByUserIdAndProductId(user.getId(), item.getProductId());
        if (existing != null) {
            if (existing.isDeleted()) existing.active();
            existing.applyQuantity(item.getQuantity());
            return existing.getId();
        }
        return cartItemRepository.save(new CartItemEntity(
            user.getId(), item.getProductId(), item.getQuantity()
        )).getId();
    }
}
```

### 5-3. 메서드 반환 패턴 (CQS)

| 분류 | 비율 | 반환 | 설명 |
|------|------|------|------|
| **Query** | 45% | 도메인 객체 | 조회만, 부수 효과 없음 |
| **Command → Unit** | 15% | void | 부수 효과만, 반환 없음 |
| **Command + Return** | 40% | Long/Int | 부수 효과 + ID 반환 (컨트롤러에서 대부분 무시) |

---

## 6. 컨트롤러

### 6-1. 엔드포인트 구조

| 경로 접두사 | 용도 | 인증 |
|-----------|------|------|
| `/v1/...` | 사용자 API | `User` (Header: `DODN-Commerce-User-Id`) |
| `/internal-batch/...` | 배치 API | 없음 (내부 네트워크) |
| `/health` | 헬스체크 | 없음 |

#### 전체 엔드포인트 목록

| HTTP | 경로 | 서비스 메서드 | 응답 |
|------|------|-------------|------|
| GET | `/health` | — | `ApiResponse<Object>` |
| **주문** ||||
| POST | `/v1/orders` | `orderService.create()` | `CreateOrderResponse` |
| POST | `/v1/cart-orders` | `cartService.getCart()` → `orderService.create()` | `CreateOrderResponse` |
| GET | `/v1/orders/{orderKey}/checkout` | `orderService` + `ownedCouponService` + `pointService` | `OrderCheckoutResponse` |
| GET | `/v1/orders` | `orderService.getOrders()` | `List<OrderListResponse>` |
| GET | `/v1/orders/{orderKey}` | `orderService.getOrder()` | `OrderResponse` |
| **결제** ||||
| POST | `/v1/payments` | `paymentService.createPayment()` | `CreatePaymentResponse` |
| POST | `/v1/payments/callback/success` | `paymentService.success()` | `ApiResponse<Any>` |
| POST | `/v1/payments/callback/fail` | `paymentService.fail()` | `ApiResponse<Any>` |
| **취소** ||||
| POST | `/v1/cancel` | `cancelService.cancel()` | `ApiResponse<Any>` |
| **장바구니** ||||
| GET | `/v1/cart` | `cartService.getCart()` | `CartResponse` |
| POST | `/v1/cart/items` | `cartService.addCartItem()` | `ApiResponse<Any>` |
| PUT | `/v1/cart/items/{cartItemId}` | `cartService.modifyCartItem()` | `ApiResponse<Any>` |
| DELETE | `/v1/cart/items/{cartItemId}` | `cartService.deleteCartItem()` | `ApiResponse<Any>` |
| **상품** ||||
| GET | `/v1/products` | `productService.findProducts()` | `PageResponse<ProductResponse>` |
| GET | `/v1/products/{productId}` | `productService` + `sectionService` + `reviewService` + `couponService` | `ProductDetailResponse` |
| **쿠폰** ||||
| POST | `/v1/coupons/{couponId}/download` | `ownedCouponService.download()` | `ApiResponse<Any>` |
| GET | `/v1/owned-coupons` | `ownedCouponService.getOwnedCoupons()` | `List<OwnedCouponResponse>` |
| **리뷰** ||||
| GET | `/v1/reviews` | `reviewService.findReviews()` | `PageResponse<ReviewResponse>` |
| POST | `/v1/reviews` | `reviewService.addReview()` | `ApiResponse<Any>` |
| PUT | `/v1/reviews/{reviewId}` | `reviewService.updateReview()` | `ApiResponse<Any>` |
| DELETE | `/v1/reviews/{reviewId}` | `reviewService.removeReview()` | `ApiResponse<Any>` |
| **Q&A** ||||
| GET | `/v1/qna` | `qnaService.findQnA()` | `PageResponse<QnAResponse>` |
| POST | `/v1/questions` | `qnaService.addQuestion()` | `ApiResponse<Any>` |
| PUT | `/v1/questions/{questionId}` | `qnaService.updateQuestion()` | `ApiResponse<Any>` |
| DELETE | `/v1/questions/{questionId}` | `qnaService.removeQuestion()` | `ApiResponse<Any>` |
| **즐겨찾기** ||||
| GET | `/v1/favorites` | `favoriteService.findFavorites()` | `PageResponse<FavoriteResponse>` |
| POST | `/v1/favorites` | `favoriteService.addFavorite()` / `removeFavorite()` | `ApiResponse<Any>` |
| **포인트** ||||
| GET | `/v1/point` | `pointService.balance()` + `histories()` | `PointResponse` |
| **정산 (배치)** ||||
| POST | `/internal-batch/load-targets` | `settlementService.loadTargets()` | `ApiResponse<Any>` |
| POST | `/internal-batch/calculate` | `settlementService.calculate()` | `ApiResponse<Any>` |
| POST | `/internal-batch/transfer` | `settlementService.transfer()` | `ApiResponse<Any>` |

### 6-2. 역할

| 역할 | 설명 | 예시 |
|------|------|------|
| **Request 변환** | `request.toXxx()` 호출 | `request.toNewOrder(user)` |
| **서비스 호출** | 단일 또는 다중 서비스 호출 | `orderService.create(user, newOrder)` |
| **Response 생성** | `Response.of(domain)` 팩토리 | `OrderResponse.of(order)` |
| **다중 서비스 조합** | 하나의 API에서 여러 서비스 결과 병합 | `findProduct()` → product + section + review + coupon |

```java
@RestController
public class OrderController {

    private final OrderService orderService;

    // CREATE — Request → Domain 변환 → 서비스 호출 → ID 응답
    @PostMapping("/v1/orders")
    public ApiResponse<CreateOrderResponse> create(User user, @RequestBody CreateOrderRequest request) {
        String key = orderService.create(user, request.toNewOrder(user));
        return ApiResponse.success(new CreateOrderResponse(key));
    }

    // READ — 서비스 호출 → Response.of() 팩토리 → 응답
    @GetMapping("/v1/orders/{orderKey}")
    public ApiResponse<OrderResponse> getOrder(User user, @PathVariable String orderKey) {
        Order order = orderService.getOrder(user, orderKey, OrderState.PAID);
        return ApiResponse.success(OrderResponse.of(order));
    }

    // COMMAND (빈 응답) — 서비스 호출 → ApiResponse.success()
    // @DeleteMapping, @PostMapping 등 CUD 대부분 이 패턴
}
```

---

## 7. 레이어드 아키텍처

### 7-1. DTO / 도메인 / 엔티티

```
[Controller 계층]        [Service 계층]         [Storage 계층]
Request (data class) ──→ Domain (data class) ──→ Entity (class)
                     ←── Domain (data class) ←── Entity (class)
Response (data class) ←─ Domain (data class)
```

| 객체 | 위치 | 역할 | 키워드 |
|------|------|------|--------|
| **Request** | `controller/v1/request/` | API 입력 바인딩 + 변환 메서드 | `data class`, `toXxx()` |
| **Response** | `controller/v1/response/` | API 출력 직렬화 | `data class`, `companion object { fun of() }` |
| **Domain** | `domain/` | 비즈니스 로직 전달 객체 | `data class`, 불변 |
| **Entity** | `storage/db-core/` | DB 매핑 + 상태 변경 메서드 | `class extends BaseEntity` |

### 7-2. 변환 흐름

```
[Request → Domain]
  Request.toXxx() 메서드: Request 내에 정의
  ex) CreateOrderRequest.toNewOrder(user) → NewOrder

[Domain → Entity]
  서비스 내에서 직접 Entity 생성자 호출
  ex) OrderEntity(userId, orderKey, name, totalPrice, state)

[Entity → Domain]
  서비스 내에서 직접 Domain 생성자 호출
  ex) Order(id, key, name, userId, totalPrice, state, items)

[Domain → Response]
  Response.of(domain) 팩토리: Response 내 companion object에 정의
  ex) OrderResponse.of(order) → OrderResponse
```

```java
// Request — toXxx() 변환 메서드
public class CreateOrderRequest {
    private Long productId;
    private Long quantity;

    public NewOrder toNewOrder(User user) {
        if (quantity <= 0) throw new CoreException(ErrorType.INVALID_REQUEST);
        return new NewOrder(user.getId(), List.of(new NewOrderItem(productId, quantity)));
    }
}

// Response — of() 팩토리 메서드
public class OrderResponse {
    // fields...

    public static OrderResponse of(Order order) {
        return new OrderResponse(order.getId(), order.getKey(), /* ... */);
    }
}
```

### 7-3. 계층별 역할 정리

#### 기본 계층

| 계층 | 허용 | 금지 |
|------|------|------|
| **Controller** | Request 변환, 서비스 호출, Response 생성 | 비즈니스 로직, 직접 Repository 호출 |
| **Repository** | 데이터 접근, JPQL 쿼리 | 비즈니스 로직, 상태 변경 |
| **Entity** | 상태 전이, 값 변경 (메서드) | 검증 로직 (`if/throw` 없음) |

#### 서비스 계층

| 유형 | 허용 | 금지 |
|------|------|------|
| **Facade Service** | 여러 전문 서비스 조합, 트랜잭션 경계 설정 | 직접 Repository 호출, HTTP 관련 코드 |
| **단일 Service** | 직접 Repository 호출, 비즈니스 로직, 트랜잭션 관리 | HTTP 관련 코드, Response 생성 |
| **Finder** | 조회 전용, Repository 호출, 엔티티→도메인 변환 | 쓰기, 상태 변경 |
| **Manager** | 쓰기 전용, 엔티티 상태 변경, Repository 호출 | 조회 목적 메서드 |
| **Handler** | 부수 효과 처리 (포인트, 이력 기록 등) | 비즈니스 의사결정 |
| **Validator** | 정책 검증, 읽기 + 판단 | 쓰기, 상태 변경 |
| **Loader** | 배치 데이터 적재 | 실시간 처리 |

---

## 8. 유효성 검사 & 예외 처리

### 8-1. 4계층 검증

| 계층 | 위치 | 역할 | 예시 |
|------|------|------|------|
| **0) Bean Validation** | Request DTO | 필수값·형식 검증 (`@Valid` + `@NotNull`, `@NotBlank` 등) | `@NotBlank String content` |
| **1) Request** | `toXxx()` 내부 | 입력값 기본 검증 | `if (quantity <= 0) throw CoreException(INVALID_REQUEST)` |
| **2) Service** | 서비스 메서드 | 비즈니스 규칙 검증 | `if (order.userId != user.id) throw CoreException(NOT_FOUND_DATA)` |
| **3) Domain/Validator** | 전문 Validator | 정책 검증 | `ReviewPolicyValidator.validateNew()` — 주문 내역 기반 리뷰 가능 여부 |

### 8-2. 검증 규칙 목록

| 규칙 | 위치 | 검증 내용 |
|------|------|----------|
| 수량 양수 | Request | `quantity <= 0` → `INVALID_REQUEST` |
| 상품 존재 | Service | `productMap.isEmpty()` → `NOT_FOUND_DATA` |
| 상품 일치 | Service | `productMap.keys != orderProductIds` → `PRODUCT_MISMATCH_IN_ORDER` |
| 주문 소유자 | Service | `order.userId != user.id` → `NOT_FOUND_DATA` |
| 결제 상태 | Service | `payment.state != READY` → `PAYMENT_INVALID_STATE` |
| 결제 금액 | Service | `payment.paidAmount != amount` → `PAYMENT_AMOUNT_MISMATCH` |
| 이중 결제 | Service | `findByOrderId(...).state == SUCCESS` → `ORDER_ALREADY_PAID` |
| 쿠폰 만료 | Service | `findByIdAndStatusAndExpiredAtAfter() == null` → `COUPON_NOT_FOUND_OR_EXPIRED` |
| 쿠폰 중복 다운 | Service | `existing != null` → `COUPON_ALREADY_DOWNLOADED` |
| 리뷰 자격 | Validator | 14일 내 결제 완료 주문 없음 → `REVIEW_HAS_NOT_ORDER` |
| 리뷰 수정 기한 | Validator | `createdAt + 7일 < now` → `REVIEW_UPDATE_EXPIRED` |
| 포인트 초과 | Domain | `balance + amount < 0` → `POINT_EXCEEDS_BALANCE` |

### 8-3. 핵심 원칙

**규칙**: 서비스가 검증, 엔티티는 실행만. 엔티티 메서드에 if/throw 없음.

```java
// 서비스 — 검증
@Transactional
public Long success(String orderKey, String externalPaymentKey, BigDecimal amount) {
    OrderEntity order = orderRepository.findByOrderKeyAndStateAndStatus(...)
        .orElseThrow(() -> new CoreException(ErrorType.NOT_FOUND_DATA));

    PaymentEntity payment = paymentRepository.findByOrderId(order.getId())
        .orElseThrow(() -> new CoreException(ErrorType.NOT_FOUND_DATA));

    if (payment.getState() != PaymentState.READY)
        throw new CoreException(ErrorType.PAYMENT_INVALID_STATE);    // 서비스가 검증
    if (!payment.getPaidAmount().equals(amount))
        throw new CoreException(ErrorType.PAYMENT_AMOUNT_MISMATCH);  // 서비스가 검증

    payment.success(externalPaymentKey, PaymentMethod.CARD, "승인번호");  // 엔티티는 실행만
    order.paid();                                                          // 엔티티는 실행만
}
```

---

## 9. 트랜잭션 관리

### 9-1. @Transactional 사용 규칙

| 규칙 | 설명 |
|------|------|
| **쓰기 메서드에만** | 엔티티 상태 변경 또는 save/saveAll 호출 시 |
| **읽기 메서드** | `@Transactional` 없음 (기본 auto-commit) |
| **import** | `org.springframework.transaction.annotation.Transactional` 사용 |

### 9-2. @Transactional 배치 매핑

| 서비스 | 메서드 | @Transactional | 쓰기 대상 |
|--------|--------|---------------|----------|
| OrderService | `create()` | ✅ | Order + OrderItem |
| OrderService | `getOrders()` | ✅ | (읽기지만 붙어있음) |
| OrderService | `getOrder()` | ✅ | (읽기지만 붙어있음) |
| PaymentService | `createPayment()` | ✅ | Payment |
| PaymentService | `success()` | ✅ | Payment + Order + OwnedCoupon + Point + TransactionHistory |
| PaymentService | `fail()` | ❌ | TransactionHistory (save만) |
| CancelService | `cancel()` | ✅ | Order + OwnedCoupon + Point + Cancel + TransactionHistory |
| CartService | `addCartItem()` | ✅ | CartItem (save 또는 dirty checking) |
| CartService | `modifyCartItem()` | ✅ | CartItem (dirty checking) |
| CartService | `deleteCartItem()` | ✅ | CartItem (dirty checking) |
| PointHandler | `earn()` | ✅ | PointBalance + PointHistory |
| PointHandler | `deduct()` | ✅ | PointBalance + PointHistory |
| ReviewManager | `update()` | ✅ | Review (dirty checking) |
| ReviewManager | `delete()` | ✅ | Review (dirty checking) |
| QnAService | `updateQuestion()` | ✅ | Question (dirty checking) |
| QnAService | `removeQuestion()` | ✅ | Question (dirty checking) |
| FavoriteService | `addFavorite()` | ✅ | Favorite (save 또는 dirty checking) |
| FavoriteService | `removeFavorite()` | ✅ | Favorite (dirty checking) |
| SettlementService | `calculate()` | ✅ | Settlement (saveAll) |
| SettlementTargetLoader | `process()` | ✅ | SettlementTarget (saveAll) |

### 9-3. 쓰기 메커니즘

| 메커니즘 | 사용 시점 | 예시 |
|----------|----------|------|
| **Dirty Checking** | 기존 엔티티의 필드 변경 | `payment.success()`, `order.paid()` |
| **save()** | 새 엔티티 1건 저장 | `orderRepository.save(order)` |
| **saveAll()** | 새 엔티티 N건 일괄 저장 | `orderItemRepository.saveAll(items)` |
| **혼합** | Dirty Checking 후 명시적 saveAll | `settlement.sent()` → `saveAll()` |

---

## 10. 테스트

### 10-1. 태그 기반 분류

| 태그 | 기반 클래스 | 기본 실행 | 설명 |
|------|-----------|----------|------|
| (없음) | 없음 | ✅ `test` | 순수 단위 테스트 |
| `context` | `ContextTest` | ✅ `test` | Spring Context 로드 통합 테스트 |
| `develop` | `DevelopTest` | ❌ 제외 | 개발 중 임시 테스트 |

| Gradle Task | 포함 | 제외 |
|-------------|------|------|
| `test` | 전체 | `develop` |
| `unitTest` | 전체 | `develop`, `context` |
| `contextTest` | `context`만 | 나머지 |
| `developTest` | `develop`만 | 나머지 |

### 10-2. 테스트 기반 클래스

```java
// ContextTest — Spring 통합 테스트 기반
@Tag("context")
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
public abstract class ContextTest { }

// DevelopTest — 개발 전용 (CI 제외)
@Tag("develop")
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
public abstract class DevelopTest { }

// CoreDbContextTest — db-core 모듈 전용 (local 프로파일)
@Tag("context")
@ActiveProfiles("local")
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
public abstract class CoreDbContextTest { }
```

**테스트 프레임워크**: JUnit 5 (`useJUnitPlatform()`) + `springmockk` (MockK 기반 Spring 테스트 지원). 현재 MockK를 활용한 단위 테스트는 미작성 상태.

### 10-3. GWT (Given-When-Then) 패턴

```java
class PaymentServiceTest extends ContextTest {

    @Test
    @Transactional
    void 결제_성공_시_포인트_차감_및_적립과_히스토리가_기록된다() {
        // given — 테스트 데이터 준비 (엔티티 직접 save)
        pointBalanceRepository.save(new PointBalanceEntity(userId, initialPoint));
        OrderEntity order = orderRepository.save(new OrderEntity(userId, orderKey, ...));
        PaymentEntity payment = paymentRepository.save(new PaymentEntity(userId, order.getId(), ...));

        // when — 테스트 대상 메서드 호출
        Long resultPaymentId = paymentService.success(orderKey, "PG-EXT-KEY", paidAmount);

        // then — 결과 검증 (AssertJ)
        PaymentEntity updated = paymentRepository.findById(resultPaymentId).orElseThrow();
        assertThat(updated.getState()).isEqualTo(PaymentState.SUCCESS);
        assertThat(updated.getExternalPaymentKey()).isEqualTo("PG-EXT-KEY");

        // 연관 엔티티 검증
        OrderEntity updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getState()).isEqualTo(OrderState.PAID);

        List<PointHistoryEntity> histories = pointHistoryRepository.findByUserId(userId);
        assertThat(histories).hasSize(2);
    }
}
```

### 10-4. ErrorType 무결성 테스트

```java
// ErrorCode 중복/미사용 자동 검증
class ErrorTypeTest {
    @Test
    void ErrorCode_중복_사용_확인() {
        Map<ErrorCode, Long> counts = Arrays.stream(ErrorType.values())
            .collect(Collectors.groupingBy(ErrorType::getCode, Collectors.counting()));
        Set<ErrorCode> duplicates = counts.entrySet().stream()
            .filter(e -> e.getValue() > 1).map(Map.Entry::getKey).collect(Collectors.toSet());
        assertTrue(duplicates.isEmpty(), "중복된 ErrorCode: " + duplicates);
    }

    @Test
    void ErrorCode가_ErrorType에서_모두_사용되는지_확인() {
        Set<ErrorCode> declared = Set.of(ErrorCode.values());
        Set<ErrorCode> used = Arrays.stream(ErrorType.values())
            .map(ErrorType::getCode).collect(Collectors.toSet());
        Set<ErrorCode> unused = new HashSet<>(declared);
        unused.removeAll(used);
        assertTrue(unused.isEmpty(), "미사용 ErrorCode: " + unused);
    }
}
```

### 10-5. 테스트 케이스 패턴

| 패턴 | 기반 클래스 | 모듈 | 핵심 규칙 | 대표 테스트 |
|------|-----------|------|----------|------------|
| **컨텍스트 로드** | `ContextTest` / `CoreDbContextTest` | 각 모듈 | 빈 메서드 1개, 컨텍스트 로드 성공 = 통과 | `CoreApiApplicationTest` |
| **서비스 통합** | `ContextTest` | core-api | GWT: 엔티티 save → 서비스 호출(`@Transactional`) → 상태·잔액·히스토리·트랜잭션 전수 검증 | `PaymentServiceTest` |
| **Enum 무결성** | 없음 (순수 단위) | core-api | ErrorCode 중복 0건 + 미사용 0건 자동 검출 | `ErrorTypeTest` |
| **리포지토리 필터** | `CoreDbContextTest` | db-core | "포함 1건 + WHERE 조건별 제외 N건" → `containsExactly` 검증 | `OwnedCouponRepositoryTest` |
| **리포지토리 집계** | `CoreDbContextTest` | db-core | 복수 행 + DISTINCT 행 + 제외 행 → SUM/COUNT/COUNT DISTINCT (음수 별도 `@Test`) | `SettlementTargetRepositoryTest` |

**주요 검증 패턴:**

```java
assertThat(updated.getState()).isEqualTo(PaymentState.SUCCESS);          // 상태 전이
assertThat(balance.getBalance()).isEqualByComparingTo(expectedBalance);  // BigDecimal 비교
histories.sort(Comparator.comparing(PointHistoryEntity::getId));         // 히스토리 정렬
assertThat(histories).hasSize(2);                                        // 건수 검증
assertThat(txs).anySatisfy(tx -> {                                       // 특정 항목 검증
    assertThat(tx.getPaymentId()).isEqualTo(payment.getId());
    assertThat(tx.getAmount()).isEqualByComparingTo(paidAmount);
});
```

---

## 11. 네이밍 컨벤션

### 11-1. 클래스 네이밍

| 접미사 | 계층 | 역할 | 예시 |
|--------|------|------|------|
| `Entity` | Storage | JPA 엔티티 | `OrderEntity`, `PaymentEntity` |
| `Repository` | Storage | 데이터 접근 | `OrderRepository` |
| `Service` | Domain | Facade / 단일 서비스 | `OrderService`, `ReviewService` |
| `Finder` | Domain | 조회 전용 | `ProductFinder`, `ReviewFinder` |
| `Manager` | Domain | 쓰기 전용 | `ReviewManager` |
| `Handler` | Domain | 부수 효과 | `PointHandler` |
| `Validator` | Domain | 정책 검증 | `ReviewPolicyValidator` |
| `Loader` | Domain | 배치 적재 | `SettlementTargetLoader` |
| `Calculator` | Domain | 계산 유틸 | `SettlementCalculator` |
| `Generator` | Domain | 키/ID 생성 | `OrderKeyGenerator` |
| `Controller` | API | REST 엔드포인트 | `OrderController` |
| `Request` | API | API 입력 DTO | `CreateOrderRequest` |
| `Response` | API | API 출력 DTO | `OrderResponse` |

### 11-2. 메서드 네이밍

| 접두사 | 역할 | 반환 | 예시 |
|--------|------|------|------|
| `create` | 생성 (C) | ID / Key | `create()`, `createPayment()` |
| `add` | 추가 (C) | ID | `addCartItem()`, `addReview()`, `addQuestion()` |
| `find` / `get` | 조회 (R) | 도메인 객체 | `findProducts()`, `getOrders()`, `getCart()` |
| `update` / `modify` | 수정 (U) | ID | `updateReview()`, `modifyCartItem()` |
| `delete` / `remove` | 삭제 (D) | ID / void | `deleteCartItem()`, `removeReview()`, `removeQuestion()` |
| `cancel` | 취소 | ID | `cancel()` |
| `download` | 다운로드 | void | `download()` (쿠폰) |
| `success` / `fail` | 콜백 | ID / void | `success()`, `fail()` (결제) |
| `earn` / `deduct` | 포인트 | void | `earn()`, `deduct()` |
| `balance` / `histories` | 조회 | 도메인 | `balance()`, `histories()` |
| `validate` | 검증 | 검증 결과 / void | `validateNew()`, `validateUpdate()` |
| `process` | 배치 처리 | void | `process()` (정산 적재) |
| `calculate` / `transfer` | 배치 | Int | `calculate()`, `transfer()` (정산) |
| `loadTargets` | 배치 | void | `loadTargets()` (정산) |

### 11-3. 필드 네이밍

| 패턴 | 예시 | 설명 |
|------|------|------|
| **ID 참조** | `userId`, `orderId`, `productId` | FK 관계를 Long ID로 표현 (JPA 연관관계 없음) |
| **금액** | `totalPrice`, `unitPrice`, `paidAmount`, `couponDiscount` | `BigDecimal` |
| **상태** | `state` | 비즈니스 상태 (enum) |
| **상태 (시스템)** | `status` | `EntityStatus` (ACTIVE/DELETED) — BaseEntity |
| **일시** | `createdAt`, `updatedAt`, `paidAt`, `canceledAt`, `favoritedAt` | `LocalDateTime` |
| **키** | `orderKey`, `reviewKey`, `externalPaymentKey` | 외부 식별자 (String) |

---

## 12. 상수 / 열거형 관리

### 12-1. 열거형 (core-enum 모듈)

독립 모듈(`core-enum`)에 모든 열거형을 정의하여 모듈 간 공유.

| Enum | 값 | 사용 엔티티 |
|------|-----|-----------|
| `EntityStatus` | `ACTIVE`, `DELETED` | BaseEntity (전체) |
| `OrderState` | `CREATED`, `PAID`, `CANCELED` | OrderEntity |
| `PaymentState` | `READY`, `SUCCESS` | PaymentEntity |
| `PaymentMethod` | `CARD`, `ACCOUNT`, `TRANSFER`, `EASY_PAY` | PaymentEntity |
| `OwnedCouponState` | `DOWNLOADED`, `USED` | OwnedCouponEntity |
| `CouponType` | `FIXED_AMOUNT` | CouponEntity |
| `CouponTargetType` | `PRODUCT`, `PRODUCT_CATEGORY` | CouponTargetEntity |
| `TransactionType` | `PAYMENT`, `PAYMENT_FAIL`, `CANCEL` | TransactionHistoryEntity |
| `PointType` | `PAYMENT`, `REVIEW` | PointHistoryEntity |
| `ProductSectionType` | `IMAGE`, `HTML` | ProductSectionEntity |
| `ReviewTargetType` | `PRODUCT` | ReviewEntity |
| `SettlementState` | `READY`, `SENT` | SettlementEntity |

### 12-2. 도메인 상수

```java
// PointAmount — 도메인 비즈니스 상수 (companion object)
public class PointAmount {
    public static final BigDecimal PAYMENT = BigDecimal.valueOf(2000);
    public static final BigDecimal REVIEW = BigDecimal.valueOf(1000);
}
```

### 12-3. 에러 코드 상수

```java
// ErrorCode — 도메인별 접두사 그룹
public enum ErrorCode {
    E500, E400, E401,       // 공통
    E1000,                   // 주문
    E2000, E2001, E2002,     // 결제
    E3000,                   // 상품
    E4000, E4001,            // 쿠폰
    E5000,                   // 소유쿠폰
    E6000,                   // 포인트
    E7000, E7001, E7002      // 리뷰
}
```

### 12-4. 열거형 규칙

| 규칙 | 설명 |
|------|------|
| **위치** | 모든 열거형은 `core-enum` 모듈에 정의 |
| **저장 방식** | `@Enumerated(EnumType.STRING)` — 문자열 저장 |
| **값 없음** | 대부분 단순 이름만 (속성 없음). 예외: `ErrorType`은 4속성 |
| **무결성 테스트** | `ErrorTypeTest`로 ErrorCode 중복/미사용 자동 검증 |
| **확장** | 새 도메인 추가 시 `E{도메인번호}xxx` 접두사로 ErrorCode 할당 |

---

## 부록 1. 새 코드 작성 체크리스트

### 엔티티

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | 상속 | `BaseEntity()` 상속 (id, status, createdAt, updatedAt 자동 제공) | 3-1 |
| 2 | 어노테이션 | `@Entity` + `@Table(name = "snake_case")` | 3-3 |
| 3 | 필드 가시성 | 불변 `val`, 가변 `var + protected set` | 3-3 |
| 4 | 금액 | `BigDecimal` 타입 | 3-3 |
| 5 | Enum | `@Enumerated(EnumType.STRING)` | 12-4 |
| 6 | 동시성 | 충돌 가능 엔티티에 `@Version` 추가 | 3-6 |
| 7 | TEXT 컬럼 | `@Column(columnDefinition = "TEXT")` | 3-3 |
| 8 | 상태 변경 | 비즈니스 메서드로 캡슐화 (`success()`, `paid()`, `delete()`) | 3-3 |
| 9 | 검증 금지 | 엔티티에 if/throw 없음 — 서비스가 검증 | 8-3 |

### 열거형 (Enum)

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | 위치 | `core-enum` 모듈 `io.dodn.commerce.core.enums` 패키지 | 12-4 |
| 2 | 선언 | `enum class` + PascalCase | 11-1 |
| 3 | 상수 | UPPER_SNAKE_CASE, trailing comma | 12-4 |
| 4 | ErrorCode 연동 | 새 도메인 시 `E{번호}xxx` 접두사 할당 | 12-3 |

### 리포지토리

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | 상속 | `JpaRepository<XxxEntity, Long>` | 4-1 |
| 2 | Soft Delete 조회 | `EntityStatus` 파라미터 포함 | 4-2 |
| 3 | 페이징 | `Slice<T>` + `Pageable` (`Page<T>` 금지) | 4-3 |
| 4 | 복잡 쿼리 | JPQL `@Query` | 4-3 |
| 5 | 비즈니스 로직 금지 | 순수 데이터 접근만 | 4-4 |

### 서비스

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | 유형 결정 | Facade(`@Service`) · Finder/Manager/Handler/Validator(`@Component`) · 단일(`@Service`) | 5-1, 5-2 |
| 2 | CQS 분리 | 조회(Finder) / 쓰기(Manager) / 부수효과(Handler) / 검증(Validator) | 5-2 |
| 3 | Facade 제약 | Repository 직접 호출 금지 — 전문 서비스를 통해서만 | 7-3 |
| 4 | 트랜잭션 | Manager/Handler/Loader에 `@Transactional`, Finder/Validator에는 없음 | 5-2, 9-1 |
| 5 | 검증 원칙 | 서비스가 검증, 엔티티는 실행만 | 8-1 |

### 컨트롤러

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | 어노테이션 | `@RestController` | 6-1 |
| 2 | 흐름 | `Request.toXxx()` → 서비스 호출 → `Response.of()` → `ApiResponse.success()` | 6-2 |
| 3 | URL | `/v1/{resource}` (복수형) | 6-1 |
| 4 | 인증 | `User` 파라미터 (ArgumentResolver 자동 주입) | 6-1 |

### Request / Response

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | 선언 | `data class`, `controller/v1/request/` 또는 `response/` 패키지 | 7-1 |
| 2 | Request 변환 | `toXxx()` 메서드로 도메인 객체 반환 | 7-1 |
| 3 | Response 생성 | `companion object { fun of() }` 팩토리 | 7-1 |
| 4 | 입력 검증 | `CoreException(ErrorType.INVALID_REQUEST)` 통일 | 8-1 |
| 5 | Bean Validation | `@Valid` + `@NotNull`, `@NotBlank` 등 사용 가능. Request DTO 필드에 적용 | 8-1 |

### 에러 타입

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | ErrorCode | 도메인별 `E{번호}xxx` 접두사 | 12-3 |
| 2 | ErrorType | status, code, message, logLevel 모두 지정 | 8-2 |
| 3 | 메시지 | 한국어, 사용자 친화적 | 8-2 |
| 4 | LogLevel | 비즈니스 실패 = `INFO`, 시스템 오류 = `ERROR` | 8-3 |
| 5 | 무결성 테스트 | `ErrorTypeTest`가 자동 검출 — 추가 후 테스트 통과 확인 | 10-4, 12-4 |

### 테스트

| # | 항목 | 규칙 | 참조 |
|---|------|------|------|
| 1 | 패턴 선택 | 해당 패턴 확인 | 10-5 |
| 2 | 기반 클래스 | core-api → `ContextTest`, db-core → `CoreDbContextTest`, 순수 단위 → 없음 | 10-2 |
| 3 | GWT 구조 | `// given` · `// when` · `// then` 주석 구분 | 10-3 |
| 4 | 메서드명 | 한글 서술형 (`결제가_성공적으로_처리_되어야한다`) | 10-3 |
| 5 | BigDecimal 비교 | `isEqualByComparingTo()` (`isEqualTo` 금지) | 10-5 |

---

## 부록 2. 인터페이스 패턴

### Storage

| 유형 | 선언 | 역할 | 금지 | 참조 |
|------|------|------|------|------|
| Entity | `@Entity class Xxx : BaseEntity()` | 상태 전이, 필드 캡슐화 | if/throw, 검증, 다른 엔티티 참조 | 3-1 |
| Repository | `interface Xxx : JpaRepository<E, Long>` | Spring Data / JPQL 데이터 접근 | 비즈니스 로직, Hard Delete | 4-1 |

**Entity 메서드**

| 유형 | 시그니처 | 반환 | 규칙 | 참조 |
|------|----------|------|------|------|
| 상태 전이 | `paid()`, `canceled()`, `use()`, `revert()` | void | if/throw 금지 — 서비스가 검증 | 3-3, 8-3 |
| 값 변경 | `applyXxx(value)`, `updateContent(content)` | void | 자동 보정 허용 (`value < 1 → 1`), throw 금지 | 3-3 |
| 상태 조회 | `isXxx()`, `hasXxx()` | boolean | 자기 필드만 참조, 다른 엔티티 비교 금지 | 3-3 |

**Repository 메서드**

| 유형 | 시그니처 | 반환 | 규칙 | 참조 |
|------|----------|------|------|------|
| 단건 조회 | `findByXxxAndYyy()` | `Entity?` | Soft Delete 조건(`EntityStatus`) 포함 | 4-2 |
| 목록 조회 | `findByXxxOrderByIdDesc()` | `List<Entity>` | 정렬은 메서드명에 명시 | 4-2 |
| 페이징 조회 | `findByXxx(pageable)` | `Slice<Entity>` | `Page<T>` 금지 (COUNT 쿼리 없음) | 4-3 |
| 집합 조회 | `findByIdInAndStatus()` | `List<Entity>` | ID 목록 기반 | 4-2 |
| 커스텀 | `@Query("SELECT ...")` | 커스텀 | JPQL만 사용 (Native Query 미사용) | 4-3 |

**파라미터 규칙**

| 대상 | 허용 | 금지 |
|------|------|------|
| Entity 메서드 | 스칼라 값 (`Long`, `String`, `BigDecimal`, `Enum`) | 도메인 객체, 다른 Entity |
| Repository 메서드 | 스칼라 ID + `Enum` + `Pageable` + `LocalDateTime` | 도메인 객체 |

### Service

| 유형 | 선언 | 역할 | @Tx | 금지 | 참조 |
|------|------|------|-----|------|------|
| Facade | `@Service class XxxService` | 전문 서비스 조합 | 선택 | Repository 직접 호출 | 5-2, 7-3 |
| 단일 Service | `@Service class XxxService` | Repository + 비즈니스 로직 | ✅ | HTTP 코드, Response 생성 | 5-2, 7-3 |
| Finder | `@Component class XxxFinder` | 조회 전용 (Q) | 없음 | 쓰기, 상태 변경 | 5-2, 7-3 |
| Manager | `@Component class XxxManager` | 쓰기 전용 (C) | ✅ | 조회 목적 메서드 | 5-2, 7-3 |
| Handler | `@Component class XxxHandler` | 부수 효과 (C) | ✅ | 비즈니스 의사결정 | 5-2, 7-3 |
| Validator | `@Component class XxxValidator` | 정책 검증 (Q) | 없음 | 쓰기, 상태 변경 | 5-2, 7-3 |
| Loader | `@Service class XxxLoader` | 배치 데이터 적재 (C) | ✅ | 실시간 처리 | 5-2 |
| Calculator | `object XxxCalculator` | 순수 계산 (상태 없음) | — | 상태 보유, 외부 의존 | 11-1 |
| Generator | `@Component class XxxGenerator` | 값/키 생성 | — | — | 11-1 |

**메서드 (CQS)**

| 접두사 | CQS | 반환 | 설명 | 참조 |
|--------|-----|------|------|------|
| `find` / `get` | Q | 도메인 객체 | 조회, 부수 효과 없음 | 5-3, 11-2 |
| `create` / `add` | C+R | Long / String | 생성 → ID/Key 반환 | 5-3, 11-2 |
| `update` / `modify` | C+R | Long | 수정 → ID 반환 | 11-2 |
| `delete` / `remove` | C+R | Long / void | Soft Delete | 11-2 |
| `cancel` | C+R | Long | 상태 복원 + 이력 기록 | 11-2 |
| `success` / `fail` | C+R / C | Long / void | PG 콜백 처리 | 11-2 |
| `earn` / `deduct` | C | void | 포인트 증감 | 11-2 |
| `validate` | Q | 결과 / void | 정책 검증 (쓰기 없음) | 11-2 |
| `download` / `process` / `loadTargets` | C | void | 리소스 획득 / 배치 적재 | 11-2 |
| `calculate` / `transfer` | C+R | Int | 집계 / 이체 | 11-2 |

**파라미터 규칙**: "조립한 것 → 도메인 객체" / "가리키는 것 → 스칼라 ID"

| 유형 | 조건 | 예시 |
|------|------|------|
| 도메인 객체 | Request.toXxx()가 조립한 입력 | `NewOrder`, `AddCartItem`, `ReviewContent` |
| 도메인 객체 | 행위 주체 | `User` |
| 도메인 객체 | 복합 식별자 · 행위 명령 | `ReviewTarget(type, id)`, `CancelAction(orderKey)` |
| 도메인 객체 | 이전 단계 조회 결과 · 계산 VO | `Order`, `PaymentDiscount` |
| 스칼라 ID | 기존 리소스 참조 | `reviewId: Long`, `couponId: Long` |
| 스칼라 값 | 외부 시스템 · 배치 파라미터 | `externalPaymentKey`, `settleDate` |

### API

| 유형 | 선언 | 역할 | 금지 | 참조 |
|------|------|------|------|------|
| Controller | `@RestController class XxxController` | Request → Service → Response | 비즈니스 로직, Repository 직접 호출 | 6-1, 7-3 |
| Request | `data class XxxRequest` | 입력 바인딩 + `toXxx()` 변환 + Bean Validation (`@Valid`, `@NotNull` 등) | — | 7-1, 8-1 |
| Response | `data class XxxResponse` | `companion object { fun of() }` 직렬화 | 비즈니스 로직 | 7-1 |

**Controller 메서드**

| HTTP | 흐름 | 응답 | 참조 |
|------|------|------|------|
| `@PostMapping` | `request.toXxx()` → `service.create()` | `ApiResponse<CreateXxxResponse>` | 6-2 |
| `@GetMapping("/{id}")` | `service.getXxx()` → `Response.of()` | `ApiResponse<XxxResponse>` | 6-2 |
| `@GetMapping` | `service.findXxx()` | `ApiResponse<PageResponse<XxxResponse>>` | 6-2 |
| `@PutMapping("/{id}")` | `request.toXxx()` → `service.update()` | `ApiResponse<Any>` | 6-2 |
| `@DeleteMapping("/{id}")` | `service.deleteXxx()` | `ApiResponse<Any>` | 6-2 |

**Request / Response 메서드**

| 클래스 | 메서드 | 규칙 | 참조 |
|--------|--------|------|------|
| Request | `toXxx()` | 입력 검증 → `CoreException(INVALID_REQUEST)` → 도메인 객체 반환 | 7-2, 8-1 |
| Response | `of(domain)` | `companion object` 팩토리 → Response 생성 | 7-2 |

**파라미터 규칙**

| 출처 | 타입 | 변환 |
|------|------|------|
| ArgumentResolver | `User` | 서비스에 그대로 전달 |
| `@RequestBody` | Request DTO | `request.toXxx()` → 도메인 객체 |
| `@PathVariable` | `Long` / `String` | 서비스에 그대로 전달 또는 `toXxx()`에 주입 |
| `@RequestParam` | 원시값 / `Enum` | 서비스에 그대로 전달 또는 도메인 객체 조립 |

### Domain

| 유형 | 선언 | 역할 | 금지 | 참조 |
|------|------|------|------|------|
| Domain 객체 | `data class Xxx` | 불변 전달 객체 (레이어 간 데이터 이동) | DB 직접 접근 | 7-1 |

### 계층 경계 요약

| 경계 | 넘어가는 것 | 넘어가지 않는 것 |
|------|-----------|---------------|
| HTTP → Controller | 원시값 (`Long`, `String`, `Enum`, JSON) | 도메인 객체 |
| Controller → Service | `User` + 도메인 객체 + 스칼라 ID (Domain Command가 DTO 필드 단순 복사인 경우, Request DTO 직접 전달 가능) | — |
| Service → Repository | 스칼라 ID + `Enum` + `Pageable` | 도메인 객체 |
| Service → Entity 메서드 | 스칼라 값 (`Long`, `String`, `BigDecimal`, `Enum`) | 도메인 객체 |

### 계층 경계 보충 규칙

| 규칙 | 설명 |
|------|------|
| Service → Entity 직접 import | Service는 Entity를 직접 import하여 사용할 수 있다 |
| Service → Request DTO 직접 import | Domain Command가 DTO 필드를 단순 복사하는 경우, Service는 Request DTO를 직접 매개변수로 받을 수 있다 |
| BaseEntity `@SoftDelete` | BaseEntity에 `@SoftDelete` 어노테이션을 적용하여 Soft Delete를 자동화할 수 있다 |
