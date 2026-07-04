package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.offer.CreateOffer;

import java.time.LocalDate;

public record CreateOfferRequest(
        @NotNull Long taskId,
        @NotNull Long workerId,
        @NotNull LocalDate due
) {
    public CreateOffer toCommand() {
        return new CreateOffer(taskId, workerId, due);
    }
}
