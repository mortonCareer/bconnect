package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.retention.RetentionHold;
import to.bconnect.api.storage.retention.RetentionHoldType;

import java.time.Instant;

public record RetentionHoldResponse(
        Long id,
        Long memberId,
        String memberName,
        String memberPhone,
        RetentionHoldType type,
        String reason,
        Instant expireAt,
        Instant withdrawnAt
) {
    public static RetentionHoldResponse of(RetentionHold hold) {
        return new RetentionHoldResponse(
                hold.id(), hold.memberId(), hold.memberName(), hold.memberPhone(), hold.type(),
                hold.reason(), hold.expireAt(), hold.withdrawnAt()
        );
    }
}
