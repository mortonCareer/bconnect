package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.recommendation.Recommendation;

import java.time.LocalDateTime;

public record RecommendationResponse(
        Long id,
        Long fromId,
        Long toId,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static RecommendationResponse of(Recommendation recommendation) {
        return new RecommendationResponse(
                recommendation.id(),
                recommendation.fromId(),
                recommendation.toId(),
                recommendation.content(),
                recommendation.visible(),
                recommendation.createdAt(),
                recommendation.modifiedAt()
        );
    }
}
