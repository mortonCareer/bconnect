package to.bconnect.api.attachment;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ConfirmRequest(
        @NotEmpty List<Long> attachmentIds
) {}
