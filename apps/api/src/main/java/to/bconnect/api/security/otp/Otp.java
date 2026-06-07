package to.bconnect.api.security.otp;

import to.bconnect.api.storage.domain.otp.OtpEntity;
import to.bconnect.api.storage.domain.otp.SignupToken;

import java.time.LocalDateTime;

public record Otp(
    Long id,
    String phone,
    String code,
    LocalDateTime expiredAt,
    int attempts,
    boolean revoked,
    SignupToken token,
    int dailyCount,
    LocalDateTime lastSentAt,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Otp of(OtpEntity entity) {
        return new Otp(
                entity.getId(),
                entity.getPhone(),
                entity.getCode(),
                entity.getExpiredAt(),
                entity.getAttempts(),
                entity.isRevoked(),
                entity.getToken(),
                entity.getDailyCount(),
                entity.getLastSentAt(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
