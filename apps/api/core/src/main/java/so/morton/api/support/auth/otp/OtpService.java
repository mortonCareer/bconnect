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
    private static final int EXPIRY_SECONDS = 180;
    private static final int MAX_DAILY_COUNT = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RATE_LIMIT_SECONDS = 60;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_FORMAT = "%06d";
    private static final int CODE_BOUND = 1_000_000;

    private final OtpRepository otpRepository;
    private final SmsProvider smsProvider;

    public void send(String phone) {
        String code = generateCode();
        LocalDateTime expiredAt = LocalDateTime.now().plusSeconds(EXPIRY_SECONDS);

        otpRepository.findByPhone(phone)
                .ifPresentOrElse(
                        saved -> {
                            if (saved.getDailyCount() >= MAX_DAILY_COUNT) {
                                throw new CodeException(AuthExceptionCode.OTP_DAILY_LIMIT);
                            }

                            if (saved.getModifiedAt() != null && saved.getModifiedAt().plusSeconds(RATE_LIMIT_SECONDS).isAfter(LocalDateTime.now())) {
                                throw new CodeException(AuthExceptionCode.OTP_RATE_LIMIT);
                            }

                            int newDailyCount;
                            if (isToday(saved.getModifiedAt())) newDailyCount = saved.getDailyCount() + 1;
                            else newDailyCount = 1;

                            saved.update(code, newDailyCount, expiredAt);
                        },
                        () -> otpRepository.save(new OtpEntity(phone, code, expiredAt))
                );

        smsProvider.send(phone, code);
    }

    public void verify(String phone, String code) {
        OtpEntity otp = otpRepository.findByPhone(phone)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.INVALID_OTP));

        otp.incrementAttemptCount();

        if (otp.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new CodeException(AuthExceptionCode.OTP_EXPIRED);
        }

        if (otp.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new CodeException(AuthExceptionCode.OTP_MAX_ATTEMPTS);
        }

        if (!otp.getCode().equals(code)) {
            throw new CodeException(AuthExceptionCode.INVALID_OTP);
        }

        otp.invalidate();
    }

    private String generateCode() {
        return String.format(CODE_FORMAT, RANDOM.nextInt(CODE_BOUND));
    }

    private boolean isToday(LocalDateTime date) {
        return date != null && date.toLocalDate().equals(LocalDate.now());
    }
}
