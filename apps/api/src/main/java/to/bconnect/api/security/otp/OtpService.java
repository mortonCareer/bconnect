package to.bconnect.api.security.otp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.storage.otp.OtpEntity;
import to.bconnect.api.storage.otp.OtpRepository;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.OffsetDateTime;

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

    private final OtpRepository otpRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Otp sendCode(String phone) {
        val code = String.format(CODE_FORMAT, RANDOM.nextInt(CODE_BOUND));
        val expiredAt = OffsetDateTime.now().plusSeconds(EXPIRY_SECONDS);

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
        if (found.getExpiredAt().isBefore(OffsetDateTime.now())) throw new CodeException(AuthExceptionCode.OTP_EXPIRED);
        if (!found.getCode().equals(code)) throw new CodeException(AuthExceptionCode.INVALID_OTP);

        found.invalidateCode();
    }

    private boolean isRateLimited(OtpEntity found) {
        return found.getLastSentAt().plusSeconds(RATE_LIMIT_SECONDS).isAfter(OffsetDateTime.now());
    }

    private boolean isToday(OffsetDateTime date) {
        return date.toLocalDate().equals(LocalDate.now());
    }
}
