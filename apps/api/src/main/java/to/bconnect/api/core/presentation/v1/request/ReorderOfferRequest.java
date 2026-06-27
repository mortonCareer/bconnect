package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotEmpty;
import to.bconnect.api.core.domain.offer.ReorderOffers;

import java.util.List;

public record ReorderOfferRequest(
        @NotEmpty List<Long> offerIds
) {
    public ReorderOffers toCommand() {
        return new ReorderOffers(offerIds);
    }
}
