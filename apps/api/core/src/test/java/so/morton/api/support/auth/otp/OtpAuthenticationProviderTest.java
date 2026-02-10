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
    @DisplayName("인증 요청 성공 시 인증된 토큰을 반환한다")
    void authenticate_verifyRequest_성공() {
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
                .containsExactly("ROLE_GUEST");
    }

    @Test
    @DisplayName("미가입자 인증 성공 시 phone을 principal로 GUEST 권한 토큰을 반환한다")
    void authenticate_verifyRequest_미가입자_phone반환() {
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
                .containsExactly("ROLE_GUEST");
    }

    @Test
    @DisplayName("OTP 검증 실패 시 AuthenticationServiceException으로 변환한다")
    void authenticate_verifyRequest_otpService예외전파() {
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
    @DisplayName("발송 요청은 지원하지 않으며 IllegalStateException을 던진다")
    void authenticate_sendRequest_예외() {
        // given
        OtpAuthenticationToken token = new OtpAuthenticationToken(PHONE, null);

        // when & then
        assertThatThrownBy(() -> otpAuthenticationProvider.authenticate(token))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("OtpAuthenticationToken을 지원한다")
    void supports_OtpAuthenticationToken() {
        assertThat(otpAuthenticationProvider.supports(OtpAuthenticationToken.class)).isTrue();
    }

    @Test
    @DisplayName("다른 Authentication 토큰은 지원하지 않는다")
    void supports_다른토큰() {
        assertThat(otpAuthenticationProvider.supports(UsernamePasswordAuthenticationToken.class)).isFalse();
    }
}
