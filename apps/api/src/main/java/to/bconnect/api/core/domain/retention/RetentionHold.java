package to.bconnect.api.core.domain.retention;

import to.bconnect.api.storage.retention.RetentionHoldEntity;
import to.bconnect.api.storage.retention.RetentionHoldType;

import java.time.Instant;

public record RetentionHold(
        Long id,
        Long memberId,
        String memberName,
        String memberPhone,
        RetentionHoldType type,
        String reason,
        Instant expireAt,
        Instant withdrawnAt
) {
    public static RetentionHold of(RetentionHoldEntity entity) {
        return new RetentionHold(
                entity.getId(),
                entity.getMemberId(),
                entity.getMemberName(),
                entity.getMemberPhone(),
                entity.getType(),
                entity.getReason(),
                entity.getExpireAt(),
                entity.getWithdrawnAt()
        );
    }
}
