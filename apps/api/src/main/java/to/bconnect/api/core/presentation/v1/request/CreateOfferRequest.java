package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.offer.CreateOffer;

public record CreateOfferRequest(
        @NotNull Long taskId,
        @NotNull Long workerId
) {
    public CreateOffer toCommand() {
        return new CreateOffer(taskId, workerId);
    }
}
