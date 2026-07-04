package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import to.bconnect.api.core.domain.chat.CreateGroupChat;

import java.util.List;

public record CreateGroupChatRequest(
        @NotBlank String title,
        @NotEmpty @Size(min = 2) List<Long> participantIds
) {
    public CreateGroupChat toCommand() {
        return new CreateGroupChat(title, participantIds);
    }
}
