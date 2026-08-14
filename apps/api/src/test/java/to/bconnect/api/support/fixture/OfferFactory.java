package to.bconnect.api.support.fixture;

import lombok.val;
import to.bconnect.api.core.domain.offer.CreateOffer;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.offer.OfferEvent;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.LocalDate;

import static to.bconnect.api.support.fixture.FixtureConstant.MAX_DATE;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class OfferFactory {

    private static final int DEFAULT_SEQ = 1;

    public static Offer domain(Long id, Long taskId, Long workerId) {
        return new Offer(id, taskId, workerId, DEFAULT_SEQ, MAX_DATE, OfferStatus.PENDING,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static OfferEntity entity(Long taskId, Long workerId) {
        return entity(taskId, workerId, DEFAULT_SEQ);
    }

    public static OfferEntity entity(Long taskId, Long workerId, int seq) {
        return new OfferEntity(
                taskId,
                workerId,
                seq
        );
    }

    public static OfferEntity entity(Long taskId, Long workerId, int seq, OfferStatus status) {
        return entity(taskId, workerId, seq, status, MAX_DATE);
    }

    public static OfferEntity entity(Long taskId, Long workerId, int seq, OfferStatus status, LocalDate due) {
        val created = entity(taskId, workerId, seq);
        created.updateDue(due);
        switch (status) {
            case PENDING -> {}
            case ACTIVE -> created.offered();
            case ACCEPTED -> created.accept();
            case DENIED -> created.deny();
            case CANCELED -> created.cancel();
            case EXPIRED -> created.expire();
        }
        return created;
    }

    public static CreateOffer command(Long taskId, Long workerId) {
        return new CreateOffer(taskId, workerId);
    }

    public static OfferEvent event(Long offerId, Long workerId, Long companyId, Long companyOwnerId, OfferStatus status) {
        return new OfferEvent(offerId, workerId, companyId, companyOwnerId, status);
    }
}
