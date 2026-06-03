package to.bconnect.api.domain.member;

import to.bconnect.api.storage.domain.member.MemberEntity;
import to.bconnect.api.storage.common.value.Role;

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

    public static Member of(MemberEntity entity) {
        return new Member(
                entity.getId(),
                entity.getUsername(),
                entity.getName(),
                entity.getPhone(),
                entity.getPicture(),
                entity.getRole(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
