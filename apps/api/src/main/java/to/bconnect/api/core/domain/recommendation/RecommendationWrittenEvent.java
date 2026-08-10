package to.bconnect.api.core.domain.recommendation;

public record RecommendationWrittenEvent(
        Long recommendationId,
        Long fromId,
        Long toId
) { }
