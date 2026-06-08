package to.bconnect.api.core.domain.post;

import to.bconnect.api.security.member.Member;

import java.time.LocalDateTime;
import java.util.List;

public record Feed(
    Long id,
    Member member,
    Long taskId,
    List<String> images,
    String content,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {}
