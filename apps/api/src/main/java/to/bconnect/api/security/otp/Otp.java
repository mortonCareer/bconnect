package to.bconnect.api.security.otp;

import to.bconnect.api.storage.otp.OtpEntity;

import java.time.Instant;

public record Otp(
    Long id,
    String phone,
    String code,
    Instant expiredAt,
    int attempts,
    boolean revoked,
    int dailyCount,
    Instant lastSentAt,
    Instant createdAt,
    Instant modifiedAt
) {
    public static Otp of(OtpEntity entity) {
        return new Otp(
                entity.getId(),
                entity.getPhone(),
                entity.getCode(),
                entity.getExpiredAt(),
                entity.getAttempts(),
                entity.isRevoked(),
                entity.getDailyCount(),
                entity.getLastSentAt(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
