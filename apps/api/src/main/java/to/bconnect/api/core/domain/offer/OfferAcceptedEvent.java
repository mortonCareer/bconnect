package to.bconnect.api.core.domain.offer;

public record OfferAcceptedEvent(
        Long offerId,
        Long workerId,
        Long companyOwnerId
) { }
