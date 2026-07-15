package to.bconnect.api.security.otp;

import to.bconnect.api.storage.otp.OtpEntity;

import java.time.OffsetDateTime;

public record Otp(
    Long id,
    String phone,
    String code,
    OffsetDateTime expiredAt,
    int attempts,
    boolean revoked,
    int dailyCount,
    OffsetDateTime lastSentAt,
    OffsetDateTime createdAt,
    OffsetDateTime modifiedAt
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
