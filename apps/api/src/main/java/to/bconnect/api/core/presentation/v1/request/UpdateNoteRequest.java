package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateNoteRequest(
        @NotBlank String content
) {}
