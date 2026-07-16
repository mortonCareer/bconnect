package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.recommendation.Recommendation;

import java.time.Instant;

public record RecommendationResponse(
        Long id,
        MemberSummaryResponse member,
        ProfileSummaryResponse profile,
        String content,
        boolean visible,
        Instant createdAt,
        Instant modifiedAt
) {
    public static RecommendationResponse of(Recommendation recommendation, Member member, Profile profile, String picture) {
        return new RecommendationResponse(
                recommendation.id(),
                MemberSummaryResponse.of(member, picture),
                profile == null ? null : ProfileSummaryResponse.of(profile),
                recommendation.content(),
                recommendation.visible(),
                recommendation.createdAt(),
                recommendation.modifiedAt()
        );
    }
}
