package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.CodeException;
import so.morton.api.support.auth.User;
import so.morton.api.support.auth.UserService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;
import static so.morton.api.storage.value.Role.GUEST;
import static so.morton.api.support.auth.User.ROLE_PREFIX;

@ExtendWith(MockitoExtension.class)
@DisplayName("OtpAuthenticationProvider 테스트")
class OtpAuthenticationProviderTest {

    @Mock
    private OtpService otpService;

    @Mock
    private UserService userService;

    @InjectMocks
    private OtpAuthenticationProvider otpAuthenticationProvider;

    private static final String PHONE = "01012345678";
    private static final String CODE = "123456";

    @Test
    @DisplayName("가입자를 인증하면 사용자 기반 토큰을 반환한다")
    void authenticate_registeredUser() {
        // given
        OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, CODE);
        User testUser = new User(1L, PHONE, "GUEST");

        doNothing().when(otpService).verify(PHONE, CODE);
        when(userService.loadUserByPhone(PHONE)).thenReturn(testUser);

        // when
        Authentication result = otpAuthenticationProvider.authenticate(token);

        // then
        assertThat(result.isAuthenticated()).isTrue();
        assertThat(result.getPrincipal()).isInstanceOf(User.class);
        assertThat(result.getAuthorities())
                .extracting(Object::toString)
                .containsExactly(ROLE_PREFIX + GUEST);
    }

    @Test
    @DisplayName("미가입자를 인증하면 전화번호 기반 토큰을 반환한다")
    void authenticate_unregisteredUser() {
        // given
        OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, CODE);

        doNothing().when(otpService).verify(PHONE, CODE);
        when(userService.loadUserByPhone(PHONE))
                .thenThrow(new UsernameNotFoundException(PHONE));

        // when
        Authentication result = otpAuthenticationProvider.authenticate(token);

        // then
        assertThat(result.isAuthenticated()).isTrue();
        assertThat(result.getPrincipal()).isEqualTo(PHONE);
        assertThat(result.getAuthorities())
                .extracting(Object::toString)
                .containsExactly(ROLE_PREFIX + GUEST);
    }

    @Test
    @DisplayName("OTP 검증이 실패하면 예외를 던진다")
    void authenticate_invalidOtp() {
        // given
        OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, CODE);
        CodeException codeException = new CodeException(AuthExceptionCode.INVALID_OTP);

        doThrow(codeException).when(otpService).verify(PHONE, CODE);

        // when & then
        assertThatThrownBy(() -> otpAuthenticationProvider.authenticate(token))
                .isInstanceOf(AuthenticationServiceException.class)
                .hasCause(codeException);
    }

     @Test
     @DisplayName("인증 코드가 없으면 예외를 던진다")
     void authenticate_nullCode() {
         // given
         OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, null);

         // when & then
         assertThatThrownBy(() -> otpAuthenticationProvider.authenticate(token))
                 .isInstanceOf(IllegalStateException.class)
                 .hasMessage("OTP code is required for authentication");
     }

     @Test
     @DisplayName("지원하지 않는 토큰 타입을 전달하면 예외를 던진다")
     void authenticate_unsupportedToken() {
         // given
         Authentication wrongToken = UsernamePasswordAuthenticationToken.unauthenticated("user", "pass");

         // when & then
         assertThatThrownBy(() -> otpAuthenticationProvider.authenticate(wrongToken))
                 .isInstanceOf(IllegalArgumentException.class)
                 .hasMessageContaining("Only OtpAuthenticationToken is supported");
     }

    @Test
    @DisplayName("OTP 토큰 타입이면 지원한다")
    void supports_otpToken() {
        assertThat(otpAuthenticationProvider.supports(OtpAuthenticationToken.class)).isTrue();
    }

    @Test
    @DisplayName("다른 토큰 타입이면 지원하지 않는다")
    void supports_otherToken() {
        assertThat(otpAuthenticationProvider.supports(UsernamePasswordAuthenticationToken.class)).isFalse();
    }
}
