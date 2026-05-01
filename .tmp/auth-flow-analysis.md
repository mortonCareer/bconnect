# Morton API 인증 워크플로우 분석 (BE 코드 fact-only)

이 문서는 `apps/api/core/src/main/java/so/morton/api/...` 의 실제 코드만 보고 작성. 가정/추론 없음. 각 사실의 source (file:line) 명시.

## 1. 컴포넌트 인벤토리

| 영역                      | 파일                                                                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OTP 발송/검증             | `support/auth/otp/OtpService.java`                                                                                                                                                                                                                  |
| OTP 검증 인증 처리        | `support/auth/otp/OtpAuthenticationProvider.java`, `OtpAuthenticationToken.java`, `VerifyOtpAuthenticationFilter.java`, `VerifyOtpAuthenticationSuccessHandler.java`                                                                                |
| JWT 발급/검증             | `support/auth/jwt/JwtProvider.java`                                                                                                                                                                                                                 |
| JWT 인증 처리             | `support/auth/jwt/JwtAuthenticationProvider.java`, `JwtAuthenticationToken.java`, `AccessTokenAuthenticationFilter.java`, `RefreshTokenAuthenticationFilter.java`, `RefreshTokenAuthenticationSuccessHandler.java`, `JwtUtils.java`, `JwtType.java` |
| Session 관리              | `support/auth/otp/SessionService.java`, `storage/.../session/SessionEntity.java`                                                                                                                                                                    |
| User 모델                 | `support/auth/User.java` (UserDetails 구현), `support/auth/UserService.java`                                                                                                                                                                        |
| Crypto util               | `support/auth/AuthUtils.java` (sha256)                                                                                                                                                                                                              |
| Spring Security 설정      | `support/auth/SecurityConfig.java`                                                                                                                                                                                                                  |
| 응답 DTO                  | `api/controller/v1/response/{VerifyOtpLoginResponse,VerifyOtpSignupResponse,RefreshTokenResponse,SendOtpResponse}.java`                                                                                                                             |
| Logout endpoint           | `api/controller/v1/AuthController.java`                                                                                                                                                                                                             |
| 회원가입 endpoint         | `api/controller/v1/MemberController.java`                                                                                                                                                                                                           |
| 설정 (secret, expiration) | `config/AppProperties.java` (record `Jwt`)                                                                                                                                                                                                          |

## 2. 데이터 모델

### `User` (Spring Security `UserDetails` 구현, `support/auth/User.java`)

```java
public record User(Long id, String username, String role) implements UserDetails {
  // getAuthorities() = List.of(new SimpleGrantedAuthority("ROLE_" + role))
  // getUsername() = username
  // getPassword() = ""
}
```

→ 1 user 당 **role 1개** (`List.of(...)` 단일).

### `SessionEntity` (`storage/.../session/SessionEntity.java`)

```
@Table("sessions")
- username     (unique, NOT NULL)
- agent        (NOT NULL)
- ip           (NOT NULL)
- refreshToken (NOT NULL)   ← sha256 hash 저장 (SessionService 가 sha256 후 set)
- revoked      (NOT NULL, default false)
- BaseEntity 의 createdAt, modifiedAt 등
```

→ user 당 **session 1개** (username unique). 신 기기 로그인 시 기존 row update.

### `Member` (`domain/member/Member.java`)

```java
public record Member(Long id, String username, String name, String phone,
                     String picture, Role role, ...) { ... }
```

→ `username` 과 `phone` 은 **별도 필드**.

### `AppProperties.Jwt` (`config/AppProperties.java`)

```
record Jwt(
  String secret (≥32 chars, HMAC-SHA256),
  Duration accessTokenExpiration,
  Duration refreshTokenExpiration
)
```

→ AT/RT 만료 시간은 환경 설정. **하나의 secret 으로 AT/RT 둘 다 sign**.

## 3. JWT 발급 (`JwtProvider.java`)

### Access Token (line 52-71, 73-91)

```java
Jwts.builder()
  .subject(username)                         // sub = username
  .claim("scope", authorities)               // comma-joined authorities (ROLE_ prefix 제거)
  .claim("type", "access")                   // type = "access"
  .issuedAt(now)                             // iat
  .expiration(now + accessTokenExpiration)   // exp
  .signWith(secret, HS256)
  .compact();
```

`authorities` 의 형성 (line 54-58, 74-78):

```java
authentication.getAuthorities().stream()
  .map(GrantedAuthority::getAuthority)
  .map(auth -> auth.substring("ROLE_".length()))   // "ROLE_" prefix 제거
  .collect(Collectors.joining(","));
```

→ `User.getAuthorities()` 가 `List.of(<single>)` 반환 (data model 참조) → comma-join 결과는 단일 string (예: `"WORKER"`).

### Refresh Token (line 93-104)

```java
Jwts.builder()
  .subject(username)                          // sub = username
  .claim("type", "refresh")                   // type = "refresh"
  .issuedAt(now)                              // iat
  .expiration(now + refreshTokenExpiration)   // exp
  .signWith(secret, HS256)
  .compact();
```

→ AT 와 같은 secret. **`scope` claim 없음**.

### 검증 (line 118-156)

```java
Jwts.parser().verifyWith(secret).build().parseSignedClaims(token).getPayload();
// ExpiredJwtException → JwtException("Expired token")
// JwtException | IllegalArgumentException → JwtException("Invalid token")
```

`getUsername(token)` = `claims.getSubject()` (line 122-124).
`getTokenType(token)` = `claims.get("type", String.class)` (line 138-140).

## 4. 인증 흐름

### 4.1 OTP 발송 — `POST /api/v1/auth/otp/send`

**path**: `support/auth/SecurityConfig.java:82` 의 `permitAll()` (otp/** 무인증)
**처리\*\*: 별도 controller 없음 — 코드에서 endpoint 정의 못 찾음. (확인 필요 — `OtpService.sendCode` 호출 path)

`OtpService.sendCode(phone)` (line 34-52):

- 6자리 random code 생성 (SecureRandom)
- `otpRepository.findByPhone(phone)` — 이미 row 있으면 update, 없으면 insert
- rate limit: 60초 (RATE_LIMIT_SECONDS)
- 일일 한도: 10 (MAX_DAILY_COUNT)
- 만료: 180초 (EXPIRY_SECONDS)
- `smsProvider.send(phone, "OTP_CODE 템플릿")`
- 반환: `expiredAt` (LocalDateTime)

응답: `SendOtpResponse(expiresAt: String)` — controller / service 사이의 wiring 코드는 별도 추적 필요.

### 4.2 OTP 검증 — `POST /api/v1/auth/otp/verify`

**Filter chain** (`SecurityConfig.java:62-92`):

1. `VerifyOtpAuthenticationFilter` (path matcher: `POST /api/v1/auth/otp/verify`)
2. `AccessTokenAuthenticationFilter`
3. `RefreshTokenAuthenticationFilter`

#### `VerifyOtpAuthenticationFilter.attemptAuthentication` (line 42-59)

```java
VerifyCodeRequest body = objectMapper.readValue(request.getInputStream(), VerifyCodeRequest.class);
String phone = body.phone().trim()
String code  = body.code().trim()
// PHONE/OTP_CODE regex 검증
OtpAuthenticationToken authRequest = new OtpAuthenticationToken(phone, code);
return this.getAuthenticationManager().authenticate(authRequest);
```

#### `OtpAuthenticationProvider.authenticate` (line 27-52)

```java
otpService.verifyCode(phone, code);  // 실패 시 AuthenticationServiceException

// Member 조회
try {
  UserDetails user = userService.loadUserByPhone(phone);
  return new OtpAuthenticationToken(user, null, user.getAuthorities());
} catch (UsernameNotFoundException) {
  // 미등록 phone — GUEST role
  return new OtpAuthenticationToken(phone, null, List.of(new SimpleGrantedAuthority("ROLE_GUEST")));
}
```

→ Phone 등록 여부에 따라 두 갈래.

#### `OtpService.verifyCode(phone, code)` (line 54-68)

```java
OtpEntity found = otpRepository.findByCode(code);  // 없으면 INVALID_OTP
if (!found.getPhone().equals(phone))    INVALID_OTP
if (found.getAttempts() >= 5)            OTP_MAX_ATTEMPTS
found.attempt();  // 시도 카운트 증가
if (found.isRevoked())                   OTP_REVOKED
if (!found.getCode().equals(code))       INVALID_OTP
found.invalidateCode();  // OTP 1회용 — 검증 후 무효화
```

#### `VerifyOtpAuthenticationSuccessHandler.onAuthenticationSuccess` (line 36-72)

**case A: principal 이 `User` (등록된 회원)** — line 46-60:

```java
String accessToken  = jwtProvider.generateAccessToken(authentication);
String refreshToken = jwtProvider.generateRefreshToken(authentication.getName());

// SessionService 가 sha256(refreshToken) 을 DB 저장
sessionService.login(user.getUsername(), agent, ip, refreshToken);

// response body 에 두 토큰 직접 포함 (Set-Cookie 없음)
write(ApiResponse.success(new VerifyOtpLoginResponse(accessToken, refreshToken)));
// VerifyOtpLoginResponse(accessToken, refreshToken) 생성자가 registered=true 자동 set
```

**case B: principal 이 String (= phone, 미등록)** — line 61-71:

```java
String signupToken = otpService.generateToken(phone);  // UUID, 10분 만료, OtpEntity 에 저장
write(ApiResponse.success(new VerifyOtpSignupResponse(signupToken)));
// VerifyOtpSignupResponse(signupToken) 생성자가 registered=false 자동 set
```

#### `SessionService.login` (`SessionService.java:39-62`)

```java
String encrypted = AuthUtils.sha256(refreshToken);   // sha256 hex
Optional<SessionEntity> found = sessionRepository.findByUsername(username);
if (found.isPresent()) {
  found.get().update(agent, ip, encrypted);          // 기존 session row update
} else {
  sessionRepository.save(new SessionEntity(username, agent, ip, encrypted));
  smsProvider.send(member.phone, NEW_DEVICE_LOGIN);  // 새 기기 알림 SMS (TODO 주석: 기존 세션 RT 무효화)
}
```

→ DB 의 `refreshToken` 필드 = `sha256(원본 RT JWT)`. 즉 **DB 에는 해시만**, BE 도 원본 RT 평문 모름.

### 4.3 인증된 요청 — `AccessTokenAuthenticationFilter`

**모든 요청** 에서 실행 (`SecurityConfig.java:93`).

```java
String token = JwtUtils.resolveBearerToken(request);  // "Authorization: Bearer <token>" 헤더
if (token == null) { filterChain.doFilter(...); return; }  // 토큰 없으면 통과 (이후 authorize 단계가 처리)

JwtAuthenticationToken authRequest = new JwtAuthenticationToken(token);
authResult = authenticationManager.authenticate(authRequest);  // → JwtAuthenticationProvider

if (authResult.isAccessToken()) {
  SecurityContextHolder.setContext(authResult);
}
filterChain.doFilter(...);
```

#### `JwtAuthenticationProvider.authenticate` (line 30-49)

```java
String token = (String) authentication.getCredentials();
jwtProvider.validateToken(token);  // signature + expiration
String username = jwtProvider.getUsername(token);
JwtType type    = JwtType.valueOf(jwtProvider.getTokenType(token).toUpperCase());
UserDetails user = userDetailsService.loadUserByUsername(username);

if (type == JwtType.REFRESH) {
  sessionService.verify(username, token);  // DB 의 sha256 해시와 비교 + isRevoked 체크
}

return new JwtAuthenticationToken(user, token, type, user.getAuthorities());
```

→ AT 와 RT 모두 같은 provider 가 처리. **type 이 REFRESH 일 때만 DB lookup**. AT 는 signature 검증만.

#### `SessionService.verify(username, refreshToken)` (`SessionService.java:26-37`)

```java
SessionEntity found = sessionRepository.findByUsername(username);  // 없으면 SESSION_EXPIRED
if (!sha256(refreshToken).equals(found.getRefreshToken()))         INVALID_REFRESH_TOKEN
if (found.isRevoked())                                              SESSION_EXPIRED
```

### 4.4 토큰 갱신 — `POST /api/v1/auth/refresh`

**Filter**: `RefreshTokenAuthenticationFilter` (path: `POST /api/v1/auth/refresh`)

```java
String token = JwtUtils.resolveCookie(request, "refreshToken");  // 쿠키에서 추출
if (token == null) { filterChain.doFilter(...); return; }

JwtAuthenticationToken authRequest = new JwtAuthenticationToken(token);
authResult = authenticationManager.authenticate(authRequest);  // → JwtAuthenticationProvider (위 4.3 와 동일, type=REFRESH 라 DB verify 함)

if (!authResult.isRefreshToken()) {
  throw new AuthenticationTypeMismatchException("Only refresh token is supported");
}

SecurityContextHolder.setContext(authResult);
this.successHandler.onAuthenticationSuccess(...);  // RefreshTokenAuthenticationSuccessHandler
```

#### `RefreshTokenAuthenticationSuccessHandler.onAuthenticationSuccess` (line 34-58)

```java
if (authToken.isRefreshToken()) {
  String username     = authentication.getName();
  String accessToken  = jwtProvider.generateAccessToken(authentication);  // 새 AT
  String refreshToken = jwtProvider.generateRefreshToken(username);        // 새 RT (rotation)
  sessionService.rotate(username, refreshToken);  // DB의 sha256 갱신

  write(ApiResponse.success(new RefreshTokenResponse(accessToken, refreshToken)));
}
```

→ **RT rotation 패턴**: refresh 시 새 AT + 새 RT 둘 다 발급. 기존 RT 는 더 이상 검증 통과 못 함 (DB의 sha256 갱신).

#### `SessionService.rotate(username, refreshToken)` (`SessionService.java:64-69`)

```java
SessionEntity found = sessionRepository.findByUsername(username);  // 없으면 SESSION_EXPIRED
found.rotate(sha256(refreshToken));  // refreshToken 필드만 갱신 (agent/ip 유지)
```

### 4.5 Logout — `POST /api/v1/auth/logout`

**Path**: `AuthController.java:18`
**Auth**: `anyRequest().authenticated()` 적용 (SecurityConfig:91) — AccessToken 으로 인증 필요

```java
@PostMapping("/logout")
public ApiResponse<Void> logout(Authentication authentication) {
  sessionService.logout(authentication.getName());
  return ApiResponse.success(null);
}
```

#### `SessionService.logout(username)` (`SessionService.java:71-76`)

```java
SessionEntity found = sessionRepository.findByUsername(username);  // 없으면 SESSION_EXPIRED
found.revoke();  // revoked = true
```

→ **DB 의 `revoked` flag 만 set**. RT JWT 자체는 만료까지 유효 (signature 통과) 하지만 `SessionService.verify` 의 `isRevoked()` 검증에서 차단.
→ Cookie 삭제 (Set-Cookie 로 maxAge=0) 코드 없음. **클라이언트 측 cookie 정리는 FE 책임**.

## 5. Session 의 의미

| BE 측                                  | 클라이언트 측                                     |
| -------------------------------------- | ------------------------------------------------- |
| DB `sessions` 테이블, user 당 1 row    | RT 의 cookie 저장 (FE 가 set, BE Set-Cookie 없음) |
| `refreshToken` 필드 = `sha256(RT_JWT)` | `refreshToken` cookie value = RT_JWT 평문         |
| `revoked` flag 로 무효화               | (Logout 시 FE 가 cookie 삭제 책임)                |

→ JWT (self-contained signature) + DB store (sha256 + revoked) 의 hybrid pattern. **각 user 당 동시 세션 1개** (username unique).

## 6. Public endpoints (`SecurityConfig.java:80-91`)

```
permitAll:
  /actuator/health
  /api/v1/auth/otp/**
  POST /api/v1/members          (회원가입)
  GET  /api/v1/profiles, /api/v1/profiles/{id}
  GET  /api/v1/posts, /api/v1/posts/{id}
  GET  /api/v1/tasks/{id}
  GET  /api/v1/feeds
  GET  /api/v1/credentials, /api/v1/credentials/types

authenticated:
  GET  /api/v1/tasks/me

hasRole("ADMIN"):
  POST /api/v1/credentials/*/accept
  POST /api/v1/credentials/*/deny

(그 외) anyRequest().authenticated()
```

## 7. Spring Security 설정 정리 (`SecurityConfig.java`)

- `sessionCreationPolicy: STATELESS` — Spring HTTP Session 안 씀 (JWT 가 그 역할)
- `csrf: disable`
- `formLogin: disable`
- `cors`: `appProperties.cors().allowedOrigins()` + `allowCredentials: true` (cookie 전송 허용)
- Filter 추가 순서 (LogoutFilter 직후):
  1. `VerifyOtpAuthenticationFilter`
  2. `AccessTokenAuthenticationFilter`
  3. `RefreshTokenAuthenticationFilter`

## 8. 응답 DTO 형태 (확인 fact)

```java
VerifyOtpLoginResponse  (boolean registered=true,  String accessToken, String refreshToken)
VerifyOtpSignupResponse (boolean registered=false, String signupToken)
RefreshTokenResponse    (String accessToken, String refreshToken)
SendOtpResponse         (LocalDateTime/String expiresAt)  // 정확한 type 별도 확인 필요
```

→ 모든 응답이 `ApiResponse.success(...)` envelope 으로 wrap (`{success: true, data: ..., error: null}`).

## 9. 핵심 fact 요약

1. **AT, RT 둘 다 JWT (HS256)**, **하나의 secret 으로 sign**
2. **claims**:
   - 공통: `sub` (= username), `type` (access | refresh), `iat`, `exp`
   - AT 만: `scope` (comma-joined authorities, 현재는 항상 단일 role)
3. **AT 발급/검증**:
   - 발급: response body
   - 전달: `Authorization: Bearer <jwt>` 헤더
   - 검증: signature 검증만 (DB lookup 없음)
4. **RT 발급/검증**:
   - 발급: response body (Set-Cookie 없음 — **FE 가 cookie 에 set 책임**)
   - 전달: `Cookie: refreshToken=<jwt>` (FE 가 set 한 cookie)
   - 검증: signature 검증 + DB 의 `sha256(token)` 비교 + `revoked` flag 체크
5. **DB store**: `sessions` 테이블에 `sha256(RT)` + `revoked` 저장. **원본 RT 평문은 BE 도 모름**.
6. **RT rotation**: `/refresh` 호출 시 새 AT + 새 RT 발급, DB 의 sha256 갱신
7. **Logout**: `sessions.revoked = true` (DB) — Cookie 삭제는 FE 책임
8. **`iss` claim 없음**, **`aud` 없음**, **`jti` 없음**
9. **multi-role 안 씀**: `User.getAuthorities()` 가 `List.of(<single>)` 반환
10. **Session 1 user = 1 row** (username unique)

## 10. 추가 확인 필요한 부분 (코드에서 못 찾음)

- `POST /api/v1/auth/otp/send` 의 controller — `OtpService.sendCode()` 호출 path
- `SendOtpResponse` 의 `expiredAt` 정확한 type
- `POST /api/v1/auth/refresh` 시 cookie 의 RT 만료 (BE 가 `Cookie: refreshToken=...; Max-Age=...` 같이 maxAge 지정 안 하니 FE 가 결정)
- 회원가입 (`POST /api/v1/members`) 시 `signupToken` 검증 path

(추가 코드 read 로 확인 가능 — 본 분석 scope 외)
