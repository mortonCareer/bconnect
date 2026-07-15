package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.chat.GroupChat;
import to.bconnect.api.core.domain.member.Member;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record GroupChatResponse(
        Long id,
        String title,
        List<MemberSummaryResponse> participants,
        MessageResponse lastMessage,
        Long unreadCount,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
) {
    public static GroupChatResponse of(GroupChat chat, List<Member> members, Map<Long, String> pictureMap) {
        return new GroupChatResponse(
                chat.id(),
                chat.title(),
                members.stream()
                        .map(it -> MemberSummaryResponse.of(it, pictureMap.get(it.id())))
                        .toList(),
                chat.lastMessage() != null ? MessageResponse.of(chat.lastMessage()) : null,
                chat.unreadCount(),
                chat.createdAt(),
                chat.modifiedAt()
        );
    }
}
