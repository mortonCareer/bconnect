package to.bconnect.api.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
public record UpdatePostRequest(
        @NotBlank String content
) {}
