package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.LocalDate;
import java.time.Instant;

public record OfferResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long taskId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int seq,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate due,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) OfferStatus status,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MemberSummaryResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ProfileSummaryResponse profile,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static OfferResponse of(Offer offer, Member member, Profile profile, String picture) {
        return new OfferResponse(
                offer.id(),
                offer.taskId(),
                offer.seq(),
                offer.due(),
                offer.status(),
                MemberSummaryResponse.of(member, picture),
                ProfileSummaryResponse.of(profile),
                offer.createdAt(),
                offer.modifiedAt()
        );
    }
}
