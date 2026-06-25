package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.offer.Offer;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record OfferResponse(
        Long id,
        Long workerId,
        LocalDate due,
        TaskResponse task,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static OfferResponse of(Offer offer, TaskResponse task) {
        return new OfferResponse(
                offer.id(),
                offer.workerId(),
                offer.due(),
                task,
                offer.createdAt(),
                offer.modifiedAt()
        );
    }
}
