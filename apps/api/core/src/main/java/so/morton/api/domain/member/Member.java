package so.morton.api.domain.member;

import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.value.Role;

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
