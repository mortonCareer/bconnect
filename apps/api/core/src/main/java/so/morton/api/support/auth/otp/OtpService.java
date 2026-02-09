package so.morton.api.support.auth.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.storage.domain.otp.OtpEntity;
import so.morton.api.storage.domain.otp.OtpRepository;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.CodeException;
import so.morton.api.support.sms.SmsProvider;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class OtpService {
    public static final int EXPIRY_SECONDS = 180;
    public static final int MAX_DAILY_COUNT = 10;
    public static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpRepository otpRepository;
    private final SmsProvider smsProvider;

    public void send(String phone) {
        String code = generateCode();
        LocalDateTime expiredAt = LocalDateTime.now().plusSeconds(EXPIRY_SECONDS);

        otpRepository.findByPhone(phone)
                .ifPresentOrElse(
                        entity -> {
                            Otp otp = Otp.of(entity);
                            if (otp.isDailyLimitReached() && isSameDay(entity)) {
                                throw new CodeException(AuthExceptionCode.OTP_RATE_LIMIT);
                            }
                            int newDailyCount = isSameDay(entity) ? entity.getDailyCount() + 1 : 1;
                            entity.update(code, newDailyCount, 0, expiredAt);
                        },
                        () -> otpRepository.save(new OtpEntity(phone, code, 1, expiredAt))
                );

        smsProvider.send(phone, code);
    }

    public void verify(String phone, String code) {
        OtpEntity entity = otpRepository.findByPhone(phone)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.INVALID_OTP));

        Otp otp = Otp.of(entity);

        if (otp.isMaxAttempts()) {
            throw new CodeException(AuthExceptionCode.OTP_MAX_ATTEMPTS);
        }
        if (otp.isExpired()) {
            throw new CodeException(AuthExceptionCode.OTP_EXPIRED);
        }
        if (!otp.matches(code)) {
            entity.incrementAttempt();
            throw new CodeException(AuthExceptionCode.INVALID_OTP);
        }
    }

    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private boolean isSameDay(OtpEntity entity) {
        return entity.getModifiedAt() != null
                && entity.getModifiedAt().toLocalDate().equals(LocalDate.now());
    }
}
