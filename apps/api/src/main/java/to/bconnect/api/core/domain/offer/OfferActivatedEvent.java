package to.bconnect.api.core.domain.offer;

public record OfferActivatedEvent(
        Long offerId,
        Long workerId,
        Long companyOwnerId
) { }
