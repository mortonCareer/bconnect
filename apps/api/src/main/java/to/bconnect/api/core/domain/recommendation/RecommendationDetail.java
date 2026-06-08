package to.bconnect.api.core.domain.recommendation;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.profile.Profile;

import java.time.LocalDateTime;

public record RecommendationDetail(
        Long id,
        Member member,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static RecommendationDetail of(Recommendation recommendation, Member member) {
        return new RecommendationDetail(
                recommendation.id(),
                member,
                recommendation.content(),
                recommendation.visible(),
                recommendation.createdAt(),
                recommendation.modifiedAt()
        );
    }
}
