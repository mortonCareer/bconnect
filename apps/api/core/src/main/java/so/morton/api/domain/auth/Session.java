package so.morton.api.domain.auth;

import java.time.LocalDateTime;

public record Session(
    Long id,
    String username,
    String agent,
    String ip,
    String refreshToken,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    // TODO: of(SessionEntity entity) 메서드
}
