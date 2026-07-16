package to.bconnect.api.core.domain.member;

import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.Role;

import java.time.Instant;

public record Member(
    Long id,
    String username,
    String name,
    String phone,
    Role role,
    Instant createdAt,
    Instant modifiedAt
) {
    public static Member withdrawn(Long id) {
        return new Member(id, null, null, null, null, null, null);
    }

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
