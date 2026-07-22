package to.bconnect.api.attachment.presentation.v1;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ConfirmRequest(
        @NotEmpty List<Long> attachmentIds
) {}
