package so.morton.api.api.controller.v1.response;

import java.time.LocalDateTime;

public record MaskedMemberResponse(
        Long id,
        String username,
        String name,
        String picture,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {}
