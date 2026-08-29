package to.bconnect.api.core.domain.retention;

import to.bconnect.api.storage.retention.RetentionHoldType;

import java.time.Instant;

public record CreateRetentionHold(
        Long memberId,
        RetentionHoldType type,
        String reason,
        Instant expireAt
) {
}
