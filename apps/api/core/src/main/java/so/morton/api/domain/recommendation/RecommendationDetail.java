package so.morton.api.domain.recommendation;

import so.morton.api.domain.member.Member;
import so.morton.api.domain.profile.Profile;

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
