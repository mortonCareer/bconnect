package so.morton.api.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import so.morton.api.support.UnitTest;
import so.morton.api.support.auth.User;
import so.morton.api.support.auth.UserService;
import so.morton.api.support.auth.otp.OtpAuthenticationProvider;
import so.morton.api.support.auth.otp.OtpAuthenticationToken;
import so.morton.api.support.auth.otp.OtpService;
import so.morton.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;
import static so.morton.api.storage.value.Role.GUEST;
import static so.morton.api.support.auth.User.ROLE_PREFIX;

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
