package to.bconnect.api.core.domain.recommendation;

import java.time.LocalDateTime;

public record Recommendation(
    Long id,
    Long fromId,
    Long toId,
    String content,
    boolean visible,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {}
