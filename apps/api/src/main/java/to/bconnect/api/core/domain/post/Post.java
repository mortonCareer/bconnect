package to.bconnect.api.core.domain.post;

import java.time.LocalDateTime;
import java.util.List;

public record Post(
    Long id,
    Long memberId,
    Long taskId,
    List<String> images,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {}
