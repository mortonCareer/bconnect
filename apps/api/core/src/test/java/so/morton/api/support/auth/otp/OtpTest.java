package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import so.morton.api.storage.domain.otp.OtpEntity;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class OtpTest {

    @Test
    @DisplayName("OtpEntity로부터 Otp 도메인 객체를 올바르게 변환한다")
    void of_convertsFromEntity() {
        // given
        String phone = "01012345678";
        String code = "123456";
        int dailyCount = 5;
        LocalDateTime expiredAt = LocalDateTime.now().plusMinutes(3);
        OtpEntity entity = new OtpEntity(phone, code, expiredAt);
        entity.update(code, dailyCount, expiredAt);
        entity.incrementAttemptCount();
        entity.incrementAttemptCount();

        // when
        Otp otp = Otp.of(entity);

        // then
        assertThat(otp.getPhone()).isEqualTo(phone);
        assertThat(otp.getCode()).isEqualTo(code);
        assertThat(otp.getDailyCount()).isEqualTo(dailyCount);
        assertThat(otp.getAttemptCount()).isEqualTo(2);
        assertThat(otp.getExpiredAt()).isEqualTo(expiredAt);
    }
}
