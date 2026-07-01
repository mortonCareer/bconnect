# security-architecture
- 위치 : `/security`
- 범위 : 회원(AuthUser), JWT, OTP, 세션(Session)

## 클래스 구조

### Spring Security Architecture
- SecurityFilterChain : 보안 필터 체인
- AuthenticationFilter : 인증 요청을 Manager에 위임, 인증 후 처리를 SuccessHandler에 위임 (Presentation 계층)
- AuthenticationProvider : 실제 인증 로직
- AuthenticationManager / ProviderManager : Provider 관리 · 진입점
- Authentication : 인증 요청·결과를 담는 데이터 객체
- SecurityContextHolder / SecurityContext : 인증된 데이터 객체를 보관 (스레드 로컬)
- UserDetailsService / UserDetails : 회원 정보를 담는 데이터 객체
- GrantedAuthority : 권한 표현 (`ROLE_` 접두사)
- AuthenticationSuccessHandler : 인증 성공 후처리

### 공통
- AuthUser (UserDetails) : 인증 주체
- AuthUserService (UserDetailsService) : AuthUser

### jwt
- JwtProvider : JWT 생성 · 검증
- JwtAuthenticationProvider (AuthenticationProvider) : JWT 인증 처리
- JwtAuthenticationToken (AbstractAuthenticationToken) : JWT 인증 토큰
- AccessTokenAuthenticationFilter (OncePerRequestFilter) : access token 인증 처리
- RefreshTokenAuthenticationFilter (OncePerRequestFilter) : refresh token 처리
- RefreshTokenAuthenticationSuccessHandler (AuthenticationSuccessHandler) : access/refresh token 재발급

### otp
- OtpService : 인증코드 발송 · 검증
- OtpAuthenticationProvider (AuthenticationProvider) : OTP 검증
- OtpAuthenticationToken (AbstractAuthenticationToken) : OTP 인증 토큰
- VerifyOtpAuthenticationFilter (AbstractAuthenticationProcessingFilter) : OTP 검증 처리
- VerifyOtpAuthenticationSuccessHandler (AuthenticationSuccessHandler) : access/refresh or signup token 발급

### session
- SessionService : 세션 처리 (다른 기기에서 로그인 등)

## 래퍼런스
- [Spring Security : Architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
- [Spring Security : Authentication](https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html)