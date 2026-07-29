package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.offer.CreateOffer;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferStatus;

import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class OfferFactory {

    private static final int DEFAULT_SEQ = 1;

    public static Offer domain(Long id, Long taskId, Long workerId) {
        return new Offer(id, taskId, workerId, DEFAULT_SEQ, MAX_DATE, OfferStatus.PENDING,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static OfferEntity entity(Long taskId, Long workerId) {
        return new OfferEntity(
                taskId,
                workerId,
                DEFAULT_SEQ
        );
    }

    public static CreateOffer command(Long taskId, Long workerId) {
        return new CreateOffer(taskId, workerId);
    }

    public static OfferEvent event(Long offerId, Long workerId, Long companyOwnerId, OfferStatus status) {
        return new OfferEvent(offerId, workerId, companyOwnerId, status);
    }
}
