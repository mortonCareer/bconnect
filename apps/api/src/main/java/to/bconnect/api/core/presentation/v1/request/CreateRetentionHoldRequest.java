package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.retention.CreateRetentionHold;
import to.bconnect.api.storage.retention.RetentionHoldType;

import java.time.Instant;

public record CreateRetentionHoldRequest(
        @NotNull Long memberId,
        @NotNull RetentionHoldType type,
        @NotBlank String reason,
        @NotNull @Future Instant expireAt
) {
    public CreateRetentionHold toCommand() {
        return new CreateRetentionHold(memberId, type, reason, expireAt);
    }
}
