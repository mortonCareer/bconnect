package so.morton.api.domain;

import java.time.LocalDateTime;

public record Participant(
    Long id,
    Long chatId,
    Long userId,
    Long lastIdx,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {}
