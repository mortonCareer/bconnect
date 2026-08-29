package to.bconnect.api.storage.retention;

import java.time.Instant;

public record TransactionPartySnapshot(
        Long memberId,
        String memberName,
        String memberPhone,
        Long counterpartyId,
        String counterpartyName,
        String counterpartyBrn,
        Instant matchedAt
) {
}
