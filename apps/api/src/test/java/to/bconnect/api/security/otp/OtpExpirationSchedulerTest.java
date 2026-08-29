package to.bconnect.api.security.otp;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import to.bconnect.api.storage.otp.OtpEntity;
import to.bconnect.api.storage.otp.OtpRepository;
import to.bconnect.api.support.IntegrationTest;

import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class OtpExpirationSchedulerTest {

    @Autowired private OtpExpirationScheduler scheduler;
    @Autowired private OtpRepository otpRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("run - 만료된 인증코드만 폐기한다")
    void run_clearExpiredCodes_success() {
        val now = Instant.now();
        val expired = otpRepository.save(new OtpEntity("01099999803", "000000", now.minusSeconds(1)));
        val retained = otpRepository.save(new OtpEntity("01099999804", "000000", now.plusSeconds(180)));

        scheduler.run();

        assertThat(otpRepository.findById(expired.getId())).get().extracting(OtpEntity::getCode).isNull();
        assertThat(otpRepository.findById(retained.getId())).get().extracting(OtpEntity::getCode).isEqualTo("000000");
    }

    @Test
    @DisplayName("run - 전날 이전이면서 만료된 OTP 행만 삭제한다")
    void run_deleteExpiredOtps_success() {
        val now = Instant.now();
        val expired = otpRepository.saveAndFlush(new OtpEntity("01099999805", "000000", now.minusSeconds(1)));
        val retained = otpRepository.saveAndFlush(new OtpEntity("01099999806", "000000", now.plusSeconds(180)));
        jdbcTemplate.update(
                "UPDATE otps SET last_sent_at = ? WHERE id = ?",
                now.minusSeconds(2L * 24 * 60 * 60).atOffset(ZoneOffset.UTC),
                expired.getId()
        );
        jdbcTemplate.update(
                "UPDATE otps SET last_sent_at = ? WHERE id = ?",
                now.minusSeconds(2L * 24 * 60 * 60).atOffset(ZoneOffset.UTC),
                retained.getId()
        );

        scheduler.run();

        assertThat(otpRepository.findById(expired.getId())).isEmpty();
        assertThat(otpRepository.findById(retained.getId())).isPresent();
    }
}
