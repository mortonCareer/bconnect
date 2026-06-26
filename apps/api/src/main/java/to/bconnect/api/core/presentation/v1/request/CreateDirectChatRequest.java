package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.chat.CreateDirectChat;

public record CreateDirectChatRequest(
        @NotNull Long memberId
) {
    public CreateDirectChat toCommand() {
        return new CreateDirectChat(memberId);
    }
}
