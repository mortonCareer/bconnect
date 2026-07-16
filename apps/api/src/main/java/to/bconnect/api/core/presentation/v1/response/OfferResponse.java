package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.storage.offer.OfferStatus;

import java.time.LocalDate;
import java.time.Instant;

public record OfferResponse(
        Long id,
        Long taskId,
        int seq,
        LocalDate due,
        OfferStatus status,
        MemberSummaryResponse member,
        ProfileSummaryResponse profile,
        Instant createdAt,
        Instant modifiedAt
) {
    public static OfferResponse of(Offer offer, Member member, Profile profile, String picture) {
        return new OfferResponse(
                offer.id(),
                offer.taskId(),
                offer.seq(),
                offer.due(),
                offer.status(),
                MemberSummaryResponse.of(member, picture),
                profile == null ? null : ProfileSummaryResponse.of(profile),
                offer.createdAt(),
                offer.modifiedAt()
        );
    }
}
