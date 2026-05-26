package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import so.morton.api.storage.value.MessageType;

public record SendMessageRequest(
        @NotNull MessageType type,
        @NotBlank String content
) {}
