package so.morton.api.domain.auth;

import java.time.LocalDateTime;

public record Otp(
    Long id,
    String username,
    String phone,
    String otp,
    int dailyCount,
    int attemptCount,
    LocalDateTime expiredAt,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    // TODO: of(OtpEntity entity) 메서드
    // TODO: 유효성 검증 메서드
}
