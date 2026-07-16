package to.bconnect.api.core.domain.recommendation;

import to.bconnect.api.storage.recommendation.RecommendationEntity;

import java.time.Instant;

public record Recommendation(
        Long id,
        Long memberId,
        String content,
        boolean visible,
        Instant createdAt,
        Instant modifiedAt
) {
    public static Recommendation of(RecommendationEntity entity, Long memberId) {
        return new Recommendation(
                entity.getId(),
                memberId,
                entity.getContent(),
                entity.isVisible(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
