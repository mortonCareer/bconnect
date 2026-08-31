package to.bconnect.api.security.otp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.storage.otp.OtpRepository;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class OtpExpirationScheduler {

    private final OtpRepository otpRepository;
    private final ApiConfigProps apiConfigProps;

    @Transactional
    @Scheduled(cron = "0 * * * * *", zone = "${app.timezone}")
    public void run() {
        val now = Instant.now();
        val startOfToday = now.atZone(apiConfigProps.zoneId())
                .toLocalDate()
                .atStartOfDay(apiConfigProps.zoneId())
                .toInstant();
        val otpCode = otpRepository.clearExpiredCodes(now);
        val otp = otpRepository.deleteExpiredBefore(startOfToday, now);
        if (otpCode > 0 || otp > 0)
            log.info("만료 OTP 파기 완료: otpCode={}, otp={}", otpCode, otp);
    }
}
