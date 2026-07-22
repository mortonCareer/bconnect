package to.bconnect.api.core.domain.recommendation;

public record CreateRecommendation(
        Long toId,
        String content
) {}
