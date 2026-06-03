package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateChatRequest(
        @NotEmpty @Size(min = 2) List<Long> participantIds,
        @NotBlank String title
) {}
