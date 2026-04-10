package so.morton.api.api.controller.v1.response;

import java.time.LocalDateTime;
import java.util.List;

public record ChatResponse(
        Long id,
        String title,
        List<MaskedMemberResponse> participants,
        MessageResponse lastMessage,
        int unreadCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {}
