package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.LocalDate;

public record OfferSummaryResponse(
        Long id,
        Long taskId,
        int seq,
        LocalDate due,
        OfferStatus status
) {
    public static OfferSummaryResponse of(Offer offer) {
        return new OfferSummaryResponse(
                offer.id(),
                offer.taskId(),
                offer.seq(),
                offer.due(),
                offer.status()
        );
    }
}
