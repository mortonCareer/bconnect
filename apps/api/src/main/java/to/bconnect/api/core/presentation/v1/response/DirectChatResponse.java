package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.chat.DirectChat;
import to.bconnect.api.core.domain.member.Member;

import java.time.LocalDateTime;

public record DirectChatResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) WithdrawableMemberResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) MessageResponse lastMessage,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long unreadCount,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt
) {
    public static DirectChatResponse of(DirectChat directChat, Member member, String picture) {
        return new DirectChatResponse(
                directChat.id(),
                WithdrawableMemberResponse.of(member, picture),
                directChat.lastMessage() != null ? MessageResponse.of(directChat.lastMessage()) : null,
                directChat.unreadCount(),
                directChat.createdAt(),
                directChat.modifiedAt()
        );
    }
}
