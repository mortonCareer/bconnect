package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import so.morton.api.storage.domain.otp.OtpEntity;
import so.morton.api.storage.domain.otp.OtpRepository;
import so.morton.api.support.AuthExceptionCode;
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

    @Mock
    private OtpRepository otpRepository;

    @Mock
    private SmsProvider smsProvider;

    @InjectMocks
    private OtpService otpService;

    private static final String PHONE = "01012345678";
    private static final String CODE = "123456";

    @Test
    @DisplayName("신규 번호로 요청하면 OTP를 생성한다")
    void send_newOtp() {
        // given
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.empty());

        // when
        otpService.send(PHONE);

        // then
        verify(otpRepository).save(any(OtpEntity.class));
        verify(smsProvider).send(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("기존 OTP가 있으면 코드를 갱신한다")
    void send_existingOtp() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        entity.update(CODE, 3, LocalDateTime.now().plusMinutes(3));
        ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now().minusMinutes(2));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when
        otpService.send(PHONE);

        // then
        assertThat(entity.getDailyCount()).isEqualTo(4);
        verify(otpRepository, never()).save(any(OtpEntity.class));
        verify(smsProvider).send(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("일일 발송 한도를 초과하면 예외를 던진다")
    void send_dailyLimitExceeded() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        entity.update(CODE, 10, LocalDateTime.now().plusMinutes(3));
        ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now().minusMinutes(2));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertCodeException(() -> otpService.send(PHONE))
                .hasExceptionCode(AuthExceptionCode.OTP_DAILY_LIMIT);
        verify(smsProvider, never()).send(anyString(), anyString());
    }

     @Test
     @DisplayName("날짜가 바뀌면 일일 발송 횟수를 초기화한다")
     void send_dailyCountReset() {
         // given
         OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
         entity.update(CODE, 5, LocalDateTime.now().plusMinutes(3));
         ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now().minusDays(1));
         when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

         // when
         otpService.send(PHONE);

         // then
         assertThat(entity.getDailyCount()).isEqualTo(1);
         verify(smsProvider).send(eq(PHONE), anyString());
     }

     @Test
     @DisplayName("재전송 대기 시간 이내에 요청하면 예외를 던진다")
     void send_rateLimited() {
         // given
         OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
         entity.update(CODE, 3, LocalDateTime.now().plusMinutes(3));
         ReflectionTestUtils.setField(entity, "modifiedAt", LocalDateTime.now().minusSeconds(30));
         when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

          // when & then
          assertCodeException(() -> otpService.send(PHONE))
                  .hasExceptionCode(AuthExceptionCode.OTP_RATE_LIMIT);
          verify(smsProvider, never()).send(anyString(), anyString());
     }

    @Test
    @DisplayName("올바른 코드로 검증하면 성공한다")
    void verify_validCode() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        otpService.verify(PHONE, CODE);
    }

    @Test
    @DisplayName("존재하지 않는 OTP로 검증하면 예외를 던진다")
    void verify_otpNotFound() {
        // given
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.empty());

        // when & then
        assertCodeException(() -> otpService.verify(PHONE, CODE))
                .hasExceptionCode(AuthExceptionCode.INVALID_OTP);
    }

    @Test
    @DisplayName("만료된 OTP로 검증하면 예외를 던진다")
    void verify_expired() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().minusMinutes(1));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertCodeException(() -> otpService.verify(PHONE, CODE))
                .hasExceptionCode(AuthExceptionCode.OTP_EXPIRED);
    }

    @Test
    @DisplayName("시도 횟수를 초과하면 예외를 던진다")
    void verify_maxAttempts() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        ReflectionTestUtils.setField(entity, "attemptCount", 5);
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertCodeException(() -> otpService.verify(PHONE, CODE))
                .hasExceptionCode(AuthExceptionCode.OTP_MAX_ATTEMPTS);
    }

    @Test
    @DisplayName("코드가 불일치하면 예외를 던진다")
    void verify_codeMismatch() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertCodeException(() -> otpService.verify(PHONE, "000000"))
                .hasExceptionCode(AuthExceptionCode.INVALID_OTP);

        assertThat(entity.getAttemptCount()).isEqualTo(1);
    }
}
