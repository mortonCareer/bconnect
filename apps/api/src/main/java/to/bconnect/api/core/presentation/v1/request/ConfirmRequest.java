package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ConfirmRequest(
        @NotEmpty List<Long> attachmentIds
) {}
