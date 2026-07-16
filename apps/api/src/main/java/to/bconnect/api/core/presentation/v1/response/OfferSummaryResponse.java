package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.LocalDate;

public record OfferSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long taskId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int seq,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate due,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) OfferStatus status
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
