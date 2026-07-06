package to.bconnect.api.core.domain.member;

import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.Role;

import java.time.LocalDateTime;

public record Member(
    Long id,
    String username,
    String name,
    String phone,
    Role role,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static final Member WITHDRAWN = new Member(null, null, null, null, null, null, null);

    public static Member of(MemberEntity entity) {
        return new Member(
                entity.getId(),
                entity.getUsername(),
                entity.getName(),
                entity.getPhone(),
                entity.getRole(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
