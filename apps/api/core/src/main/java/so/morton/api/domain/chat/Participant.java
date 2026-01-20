package so.morton.api.domain.chat;

import java.time.LocalDateTime;

public record Participant(
    Long id,
    Long chatId,
    Long memberId,
    Long lastIdx,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {}
