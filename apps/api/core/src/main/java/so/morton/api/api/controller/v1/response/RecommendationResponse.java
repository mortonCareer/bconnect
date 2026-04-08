package so.morton.api.api.controller.v1.response;

import java.time.LocalDateTime;

public record RecommendationResponse(
        Long id,
        MaskedMemberResponse member,
        ProfileResponse profile,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {}
