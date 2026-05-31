package to.bconnect.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import to.bconnect.api.common.AuthExceptionCode;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.support.UnitTest;
import to.bconnect.api.support.security.User;
import to.bconnect.api.support.security.UserService;
import to.bconnect.api.support.security.otp.OtpAuthenticationProvider;
import to.bconnect.api.support.security.otp.OtpAuthenticationToken;
import to.bconnect.api.support.security.otp.OtpService;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;
import static to.bconnect.api.storage.common.value.Role.GUEST;
import static to.bconnect.api.support.security.User.ROLE_PREFIX;

@UnitTest
@DisplayName("OtpAuthenticationProvider 테스트")
class OtpAuthenticationProviderTest {

    @Mock private OtpService otpService;
    @Mock private UserService userService;
    @InjectMocks private OtpAuthenticationProvider otpAuthenticationProvider;

    private static final String PHONE = "01000000000";
    private static final String CODE = "000000";

    @Nested
    @DisplayName("OtpAuthenticationProvider.authenticate")
    class AuthenticateTests {

        @Test
        @DisplayName("가입자 인증 성공")
        void authenticate_registeredUser() {
            // given
            OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, CODE);
            User testUser = UserFactory.GUEST_USER;

            doNothing().when(otpService).verifyCode(PHONE, CODE);
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
        @DisplayName("미가입자 인증 성공")
        void authenticate_unregisteredUser() {
            // given
            OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, CODE);

            doNothing().when(otpService).verifyCode(PHONE, CODE);
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
        @DisplayName("OTP 검증 실패 시 예외")
        void authenticate_invalidOtp() {
            // given
            OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, CODE);
            CodeException codeException = new CodeException(AuthExceptionCode.INVALID_OTP);

            doThrow(codeException).when(otpService).verifyCode(PHONE, CODE);

            // when & then
            assertThatThrownBy(() -> otpAuthenticationProvider.authenticate(token))
                    .isInstanceOf(AuthenticationServiceException.class)
                    .hasCause(codeException);
        }

        @Test
        @DisplayName("null 코드 시 예외")
        void authenticate_nullCode() {
            // given
            OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, null);

            // when & then
            assertThatThrownBy(() -> otpAuthenticationProvider.authenticate(token))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("OTP code is required for authentication");
        }

        @Test
        @DisplayName("미지원 토큰 시 예외")
        void authenticate_unsupportedToken() {
            // given
            Authentication wrongToken = UsernamePasswordAuthenticationToken.unauthenticated("user", "pass");

            // when & then
            assertThatThrownBy(() -> otpAuthenticationProvider.authenticate(wrongToken))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Only OtpAuthenticationToken is supported");
        }
    }

    @Nested
    @DisplayName("OtpAuthenticationProvider.supports")
    class SupportsTests {

        @Test
        @DisplayName("OTP 토큰 지원")
        void supports_otpToken() {
            assertThat(otpAuthenticationProvider.supports(OtpAuthenticationToken.class)).isTrue();
        }

        @Test
        @DisplayName("타 토큰 미지원")
        void supports_otherToken() {
            assertThat(otpAuthenticationProvider.supports(UsernamePasswordAuthenticationToken.class)).isFalse();
        }
    }
}
