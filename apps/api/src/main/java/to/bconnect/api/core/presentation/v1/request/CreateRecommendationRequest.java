package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.recommendation.CreateRecommendation;

public record CreateRecommendationRequest(
        @NotNull Long toId,
        @NotBlank String content
) {
    public CreateRecommendation toCommand() {
        return new CreateRecommendation(toId, content);
    }
}
