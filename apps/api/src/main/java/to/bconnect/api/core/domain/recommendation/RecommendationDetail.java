package to.bconnect.api.core.domain.recommendation;

import to.bconnect.api.security.member.Member;

import java.time.LocalDateTime;

public record RecommendationDetail(
        Long id,
        Member member,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {}
