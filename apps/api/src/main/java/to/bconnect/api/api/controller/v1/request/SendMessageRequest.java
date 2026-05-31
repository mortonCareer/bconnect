package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.common.value.MessageType;

public record SendMessageRequest(
        @NotNull MessageType type,
        @NotBlank String content
) {}
