package to.bconnect.api.domain.chat;

import to.bconnect.api.security.member.Member;

import java.time.LocalDateTime;
import java.util.List;

public record ChatDetail(
        Long id,
        String title,
        List<Member> participants,
        Message lastMessage,
        Long unreadCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {}
