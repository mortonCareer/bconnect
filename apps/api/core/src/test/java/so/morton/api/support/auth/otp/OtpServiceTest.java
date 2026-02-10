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
import so.morton.api.support.CodeException;
import so.morton.api.support.sms.SmsProvider;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    @DisplayName("send: 새 OTP 생성 및 SMS 발송")
    void send_새OTP_생성_및_SMS발송() {
        // given
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.empty());

        // when
        otpService.send(PHONE);

        // then
        verify(otpRepository).save(any(OtpEntity.class));
        verify(smsProvider).send(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("send: 기존 OTP 업데이트")
    void send_기존OTP_업데이트() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        entity.update(CODE, 3, LocalDateTime.now().plusMinutes(3));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when
        otpService.send(PHONE);

        // then
        assertThat(entity.getDailyCount()).isEqualTo(4);
        verify(otpRepository, never()).save(any(OtpEntity.class));
        verify(smsProvider).send(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("send: 일일 제한 초과 시 예외")
    void send_일일_제한_초과시_예외() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        entity.update(CODE, 10, LocalDateTime.now().plusMinutes(3));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertThatThrownBy(() -> otpService.send(PHONE))
                .isInstanceOf(CodeException.class)
                .satisfies(ex -> assertThat(((CodeException) ex).getExceptionCode())
                        .isEqualTo(AuthExceptionCode.OTP_RATE_LIMIT));
        verify(smsProvider, never()).send(anyString(), anyString());
    }

    @Test
    @DisplayName("send: 날짜 변경 시 dailyCount 리셋")
    void send_날짜_변경시_dailyCount_리셋() {
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
    @DisplayName("verify: 성공")
    void verify_성공() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        otpService.verify(PHONE, CODE);
    }

    @Test
    @DisplayName("verify: OTP 없음 예외")
    void verify_OTP없음_예외() {
        // given
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> otpService.verify(PHONE, CODE))
                .isInstanceOf(CodeException.class)
                .satisfies(ex -> assertThat(((CodeException) ex).getExceptionCode())
                        .isEqualTo(AuthExceptionCode.INVALID_OTP));
    }

    @Test
    @DisplayName("verify: 만료 예외")
    void verify_만료_예외() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().minusMinutes(1));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertThatThrownBy(() -> otpService.verify(PHONE, CODE))
                .isInstanceOf(CodeException.class)
                .satisfies(ex -> assertThat(((CodeException) ex).getExceptionCode())
                        .isEqualTo(AuthExceptionCode.OTP_EXPIRED));
    }

    @Test
    @DisplayName("verify: 시도 초과 예외")
    void verify_시도초과_예외() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        ReflectionTestUtils.setField(entity, "attemptCount", 5);
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertThatThrownBy(() -> otpService.verify(PHONE, CODE))
                .isInstanceOf(CodeException.class)
                .satisfies(ex -> assertThat(((CodeException) ex).getExceptionCode())
                        .isEqualTo(AuthExceptionCode.OTP_MAX_ATTEMPTS));
    }

    @Test
    @DisplayName("verify: 코드 불일치 예외 및 attemptCount 증가")
    void verify_코드불일치_예외_attemptCount증가() {
        // given
        OtpEntity entity = new OtpEntity(PHONE, CODE, LocalDateTime.now().plusMinutes(3));
        when(otpRepository.findByPhone(PHONE)).thenReturn(Optional.of(entity));

        // when & then
        assertThatThrownBy(() -> otpService.verify(PHONE, "000000"))
                .isInstanceOf(CodeException.class)
                .satisfies(ex -> assertThat(((CodeException) ex).getExceptionCode())
                        .isEqualTo(AuthExceptionCode.INVALID_OTP));

        assertThat(entity.getAttemptCount()).isEqualTo(1);
    }
}
