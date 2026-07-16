package to.bconnect.api.core.domain.offer;

import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.LocalDate;
import java.time.Instant;

public record Offer(
        Long id,
        Long taskId,
        Long workerId,
        int seq,
        LocalDate due,
        OfferStatus status,
        Instant createdAt,
        Instant modifiedAt
) {
    public static Offer of(OfferEntity entity) {
        return new Offer(
                entity.getId(),
                entity.getTaskId(),
                entity.getWorkerId(),
                entity.getSeq(),
                entity.getDue(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
