package to.bconnect.api.security.member;

import to.bconnect.api.storage.member.Role;

import java.time.LocalDateTime;

public record Member(
    Long id,
    String username,
    String name,
    String phone,
    String picture,
    Role role,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static final Long SYSTEM_ID = 0L;
}
