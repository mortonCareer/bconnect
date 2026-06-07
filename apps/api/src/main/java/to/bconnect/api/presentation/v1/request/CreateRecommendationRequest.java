package to.bconnect.api.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRecommendationRequest(
        @NotNull Long toId,
        @NotBlank String content
) {}
