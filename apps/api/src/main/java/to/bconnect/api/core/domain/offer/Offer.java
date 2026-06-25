package to.bconnect.api.core.domain.offer;

import to.bconnect.api.storage.offer.OfferEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record Offer(
        Long id,
        Long taskId,
        Long workerId,
        LocalDate due,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static Offer of(OfferEntity entity) {
        return new Offer(
                entity.getId(),
                entity.getTaskId(),
                entity.getWorkerId(),
                entity.getDue(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
