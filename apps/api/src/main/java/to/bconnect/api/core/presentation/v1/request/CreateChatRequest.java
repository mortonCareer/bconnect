package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import to.bconnect.api.core.domain.chat.CreateChat;

import java.util.List;

public record CreateChatRequest(
        @NotEmpty @Size(min = 2) List<Long> participantIds,
        @NotBlank String title
) {
    public CreateChat toCommand() {
        return new CreateChat(title, participantIds);
    }
}
