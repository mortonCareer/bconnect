package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.storage.domain.otp.OtpEntity;
import so.morton.api.storage.domain.otp.OtpRepository;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.fixture.OtpFactory;
import so.morton.api.support.sms.SmsProvider;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OtpService 테스트")
class OtpServiceTest {

    @Mock private OtpRepository otpRepository;
    @Mock private SmsProvider smsProvider;
    @InjectMocks private OtpService otpService;

    private static final String PHONE = "01000000000";
    private static final String CODE = "000000";

    @Nested
    @DisplayName("OtpService.sendCode")
    class SendCodeTests {

        @Test
        @DisplayName("신규 OTP 생성")
        void send_newOtp() {
            // given
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.empty());

            // when
            otpService.sendCode(PHONE);

            // then
            verify(otpRepository).save(any(OtpEntity.class));
            verify(smsProvider).send(eq(PHONE), anyString());
        }

        @Test
        @DisplayName("기존 OTP 갱신")
        void send_existingOtp() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 3, LocalDateTime.now().minusMinutes(2));
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when
            otpService.sendCode(PHONE);
            verify(otpRepository, never()).save(any(OtpEntity.class));
            verify(smsProvider).send(eq(PHONE), anyString());
        }

        @Test
        @DisplayName("일일 한도 초과 시 OTP_DAILY_LIMIT")
        void send_dailyLimitExceeded() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 10, LocalDateTime.now().minusMinutes(2));
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> otpService.sendCode(PHONE))
                    .hasExceptionCode(AuthExceptionCode.OTP_DAILY_LIMIT);
            verify(smsProvider, never()).send(anyString(), anyString());
        }

        @Test
        @DisplayName("날짜 변경 시 횟수 초기화")
        void send_dailyCountReset() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 5, LocalDateTime.now().minusDays(1));
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when
            otpService.sendCode(PHONE);

            // then
            assertThat(entity.getDailyCount()).isEqualTo(1);
            verify(smsProvider).send(eq(PHONE), anyString());
        }

        @Test
        @DisplayName("재전송 대기 시간 내 요청 시 OTP_RATE_LIMIT")
        void send_rateLimited() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 3, LocalDateTime.now().minusSeconds(30));
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> otpService.sendCode(PHONE))
                    .hasExceptionCode(AuthExceptionCode.OTP_RATE_LIMIT);
            verify(smsProvider, never()).send(anyString(), anyString());
        }

        @Test
        @DisplayName("일일 한도 9회에서 전송 성공")
        void send_dailyCount9_success() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 9, LocalDateTime.now().minusMinutes(2));
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when
            otpService.sendCode(PHONE);

            // then
            assertThat(entity.getDailyCount()).isEqualTo(10);
            verify(smsProvider).send(eq(PHONE), anyString());
        }

        @Test
        @DisplayName("재전송 대기 정확히 60초 경과 시 전송 성공")
        void send_rateLimitExact60s_success() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 3, LocalDateTime.now().minusSeconds(60));
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when
            otpService.sendCode(PHONE);

            // then
            verify(smsProvider).send(eq(PHONE), anyString());
        }
    }

    @Nested
    @DisplayName("OtpService.verifyCode")
    class VerifyCodeTests {

        @Test
        @DisplayName("검증 성공")
        void verify_validCode() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE);
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when & then
            otpService.verifyCode(PHONE, CODE);
        }

        @Test
        @DisplayName("미존재 시 INVALID_OTP")
        void verify_otpNotFound() {
            // given
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> otpService.verifyCode(PHONE, CODE))
                    .hasExceptionCode(AuthExceptionCode.INVALID_OTP);
        }

        @Test
        @DisplayName("만료 시 OTP_EXPIRED")
        void verify_expired() {
            // given
            OtpEntity entity = OtpFactory.createExpiredEntity(PHONE);
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> otpService.verifyCode(PHONE, CODE))
                    .hasExceptionCode(AuthExceptionCode.OTP_EXPIRED);
        }

        @Test
        @DisplayName("시도 횟수 초과 시 OTP_MAX_ATTEMPTS")
        void verify_maxAttempts() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 5);
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> otpService.verifyCode(PHONE, CODE))
                    .hasExceptionCode(AuthExceptionCode.OTP_MAX_ATTEMPTS);
        }

        @Test
        @DisplayName("코드 불일치 시 INVALID_OTP")
        void verify_codeMismatch() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE);
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> otpService.verifyCode(PHONE, "999999"))
                    .hasExceptionCode(AuthExceptionCode.INVALID_OTP);

            assertThat(entity.getAttemptCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("시도 횟수 4회에서 검증 성공")
        void verify_attemptCount4_success() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE, 4);
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when & then
            otpService.verifyCode(PHONE, CODE);
            assertThat(entity.getAttemptCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("검증 성공 후 코드 무효화 확인")
        void verify_success_invalidatesCode() {
            // given
            OtpEntity entity = OtpFactory.createEntity(PHONE);
            when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

            // when
            otpService.verifyCode(PHONE, CODE);

            // then
            assertThat(entity.getCodeExpiredAt()).isEqualTo(LocalDateTime.MIN);
        }
    }

    @Nested
    @DisplayName("OtpService.verifyToken")
    class VerifyTokenTests {

        @Test
        @DisplayName("만료 시 SIGNUP_TOKEN_EXPIRED")
        void verifyToken_expired() {
            // given
            String token = "expired-token";
            OtpEntity entity = OtpFactory.createEntity(PHONE);
            ReflectionTestUtils.setField(entity, "signupToken", token);
            ReflectionTestUtils.setField(entity, "signupTokenExpiredAt", LocalDateTime.now().minusMinutes(1));
            when(otpRepository.findBySignupToken(token)).thenReturn(Optional.of(entity));

            // when & then
            assertCodeException(() -> otpService.verifyToken(token))
                    .hasExceptionCode(AuthExceptionCode.SIGNUP_TOKEN_EXPIRED);
        }
    }
}
