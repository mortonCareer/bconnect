package to.bconnect.api.ws.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.value.MessageType;

public record SendMessageRequest(
        @NotNull MessageType type,
        @NotBlank String content
) {}
