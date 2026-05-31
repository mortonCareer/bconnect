package to.bconnect.api.domain.recommendation;

import to.bconnect.api.domain.member.Member;
import to.bconnect.api.domain.profile.Profile;

import java.time.LocalDateTime;

public record RecommendationDetail(
        Long id,
        Member member,
        Profile profile,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static RecommendationDetail of(Recommendation recommendation, Member member, Profile profile) {
        return new RecommendationDetail(
                recommendation.id(),
                member,
                profile,
                recommendation.content(),
                recommendation.visible(),
                recommendation.createdAt(),
                recommendation.modifiedAt()
        );
    }
}
