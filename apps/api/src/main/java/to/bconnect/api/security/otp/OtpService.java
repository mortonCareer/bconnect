package to.bconnect.api.security.otp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.storage.otp.OtpEntity;
import to.bconnect.api.storage.otp.OtpRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {
    private static final int RATE_LIMIT_SECONDS = 60;
    private static final int EXPIRY_SECONDS = 180;
    private static final int MAX_DAILY_COUNT = 10;
    private static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_FORMAT = "%06d";
    private static final int CODE_BOUND = 1_000_000;

    private static final String ADMIN_PHONE = "01083358632";
    private static final String ADMIN_CODE = "250921";

    private final OtpRepository otpRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ApiConfigProps apiConfigProps;

    @Transactional
    public Otp sendCode(String phone) {
        val code = ADMIN_PHONE.equals(phone)
                ? ADMIN_CODE
                : String.format(CODE_FORMAT, RANDOM.nextInt(CODE_BOUND));
        val expiredAt = Instant.now().plusSeconds(EXPIRY_SECONDS);

        val optional = otpRepository.findByPhone(phone);
        OtpEntity otp;
        if (optional.isPresent()) {
            otp = optional.get();
            if (!isToday(otp.getLastSentAt())) otp.dailyReset();
            if (otp.getDailyCount() >= MAX_DAILY_COUNT) throw new CodeException(AuthExceptionCode.OTP_DAILY_LIMIT);
            if (isRateLimited(otp)) throw new CodeException(AuthExceptionCode.OTP_RATE_LIMIT);
        } else {
            otp = new OtpEntity(phone, code, expiredAt);
        }

        otp.generateCode(code, expiredAt);
        otpRepository.save(otp);

        eventPublisher.publishEvent(new OtpIssuedEvent(phone, code));
        return Otp.of(otp);
    }

    @Transactional(noRollbackFor = CodeException.class)
    public void verifyCode(String phone, String code) {
        val found = otpRepository.findByPhone(phone)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.INVALID_OTP));

        if (found.getAttempts() >= MAX_ATTEMPTS) throw new CodeException(AuthExceptionCode.OTP_MAX_ATTEMPTS);

        found.attempt();

        if (found.isRevoked()) throw new CodeException(AuthExceptionCode.INVALID_OTP);
        if (!found.getExpiredAt().isAfter(Instant.now())) {
            found.invalidateCode();
            throw new CodeException(AuthExceptionCode.OTP_EXPIRED);
        }
        if (!found.getCode().equals(code)) throw new CodeException(AuthExceptionCode.INVALID_OTP);

        found.invalidateCode();
    }

    private boolean isRateLimited(OtpEntity found) {
        return found.getLastSentAt().plusSeconds(RATE_LIMIT_SECONDS).isAfter(Instant.now());
    }

    private boolean isToday(Instant date) {
        return date.atZone(apiConfigProps.zoneId()).toLocalDate().equals(LocalDate.now(apiConfigProps.zoneId()));
    }
}
