package to.bconnect.api.core.domain.member;

import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.Role;

import java.time.Instant;
import java.util.Set;

public record Member(
    Long id,
    String username,
    String name,
    String phone,
    Set<Role> roles,
    Instant createdAt,
    Instant modifiedAt
) {
    public static final String WITHDRAW_NAME = "탈퇴한 사용자";

    public static Member withdrawn(Long id) {
        return new Member(id, null, WITHDRAW_NAME, null, null, null, null);
    }

    public static Member of(MemberEntity entity) {
        return new Member(
                entity.getId(),
                entity.getUsername(),
                entity.getName(),
                entity.getPhone(),
                entity.getRoles(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
