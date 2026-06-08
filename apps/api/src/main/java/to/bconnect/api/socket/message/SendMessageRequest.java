package to.bconnect.api.socket.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.chat.MessageType;

public record SendMessageRequest(
        @NotNull MessageType type,
        @NotBlank String content
) {}
