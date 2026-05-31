package to.bconnect.api.domain.recommendation;

import to.bconnect.api.storage.domain.recommendation.RecommendationEntity;

import java.time.LocalDateTime;

public record Recommendation(
    Long id,
    Long fromId,
    Long toId,
    String content,
    boolean visible,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Recommendation of(RecommendationEntity entity) {
        return new Recommendation(
                entity.getId(),
                entity.getFromId(),
                entity.getToId(),
                entity.getContent(),
                entity.isVisible(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
