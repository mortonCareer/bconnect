package so.morton.api.support.auth.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.storage.domain.otp.OtpEntity;
import so.morton.api.storage.domain.otp.OtpRepository;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.CodeException;
import so.morton.api.support.sms.SmsProvider;
import so.morton.api.support.sms.SmsTemplate;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class OtpService {
    private static final int RATE_LIMIT_SECONDS = 60;
    private static final int EXPIRY_SECONDS = 180;
    private static final int MAX_DAILY_COUNT = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final int SIGNUP_TOKEN_EXPIRY_MINUTES = 10;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_FORMAT = "%06d";
    private static final int CODE_BOUND = 1_000_000;

    private final OtpRepository otpRepository;
    private final SmsProvider smsProvider;

    public LocalDateTime sendCode(String phone) {
        String code = String.format(CODE_FORMAT, RANDOM.nextInt(CODE_BOUND));
        LocalDateTime expiredAt = LocalDateTime.now().plusSeconds(EXPIRY_SECONDS);

        otpRepository.findByPhone(phone)
                .ifPresentOrElse(
                        found -> {
                            if (!isToday(found.getLastSentAt())) found.dailyReset();
                            if (found.getDailyCount() >= MAX_DAILY_COUNT) throw new CodeException(AuthExceptionCode.OTP_DAILY_LIMIT);
                            if (isRateLimited(found)) throw new CodeException(AuthExceptionCode.OTP_RATE_LIMIT);

                            found.generateCode(code, expiredAt);
                        },
                        () -> otpRepository.save(new OtpEntity(phone, code, expiredAt))
                );

        smsProvider.send(phone, String.format(SmsTemplate.OTP_CODE, code));
        return expiredAt;
    }

    @Transactional(noRollbackFor = CodeException.class)
    public void verifyCode(String phone, String code) {
        OtpEntity found = otpRepository.findByPhone(phone)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.INVALID_OTP));

        if (found.getAttempts() >= MAX_ATTEMPTS) throw new CodeException(AuthExceptionCode.OTP_MAX_ATTEMPTS);

        found.attempt();

        if (found.isRevoked()) throw new CodeException(AuthExceptionCode.OTP_REVOKED);
        if (!found.getCode().equals(code)) throw new CodeException(AuthExceptionCode.INVALID_OTP);

        found.invalidateCode();
    }

    public String generateToken(String phone) {
        OtpEntity found = otpRepository.findByPhone(phone)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.INVALID_OTP));

        String token = java.util.UUID.randomUUID().toString();
        LocalDateTime expiredAt = LocalDateTime.now().plusMinutes(SIGNUP_TOKEN_EXPIRY_MINUTES);
        found.generateToken(token, expiredAt);

        return token;
    }

    public void verifyToken(String phone, String token) {
        OtpEntity found = otpRepository.findByToken_Token(token)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.INVALID_SIGNUP_TOKEN));

        if (!found.getPhone().equals(phone)) throw new CodeException(AuthExceptionCode.INVALID_SIGNUP_TOKEN);
        if (found.getToken().isRevoked()) throw new CodeException(AuthExceptionCode.SIGNUP_TOKEN_REVOKED);
        
        found.invalidateToken();
    }

    private boolean isRateLimited(OtpEntity found) {
        return found.getLastSentAt().plusSeconds(RATE_LIMIT_SECONDS).isAfter(LocalDateTime.now());
    }

    private boolean isToday(LocalDateTime date) {
        return date.toLocalDate().equals(LocalDate.now());
    }
}
