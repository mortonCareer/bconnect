package to.bconnect.api.core.domain.offer;

import to.bconnect.api.storage.offer.OfferStatus;

public record OfferEvent(
        Long offerId,
        Long workerId,
        Long companyOwnerId,
        OfferStatus status
) {
}
