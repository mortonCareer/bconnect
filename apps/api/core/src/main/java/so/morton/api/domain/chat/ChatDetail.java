package so.morton.api.domain.chat;

import so.morton.api.domain.member.Member;

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
