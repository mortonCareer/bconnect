package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.chat.GroupChat;
import to.bconnect.api.core.domain.member.Member;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record GroupChatResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<WithdrawableMemberResponse> participants,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) MessageResponse lastMessage,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long unreadCount,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt
) {
    public static GroupChatResponse of(GroupChat chat, List<Member> members, Map<Long, String> pictureMap) {
        return new GroupChatResponse(
                chat.id(),
                chat.title(),
                members.stream()
                        .map(it -> WithdrawableMemberResponse.of(it, pictureMap.get(it.id())))
                        .toList(),
                chat.lastMessage() != null ? MessageResponse.of(chat.lastMessage()) : null,
                chat.unreadCount(),
                chat.createdAt(),
                chat.modifiedAt()
        );
    }
}
