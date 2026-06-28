package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.recommendation.Recommendation;
import to.bconnect.api.security.member.Member;

import java.time.LocalDateTime;

public record RecommendationResponse(
        Long id,
        MemberSummaryResponse member,
        ProfileSummaryResponse profile,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
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
