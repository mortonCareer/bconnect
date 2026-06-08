package to.bconnect.api.security.member;

import to.bconnect.api.storage.member.Role;

import java.time.LocalDateTime;

public record MemberResponse(
        Long id,
        String username,
        String name,
        String phone,
        String picture,
        Role role,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static MemberResponse of(Member member) {
        return new MemberResponse(
                member.id(),
                member.username(),
                member.name(),
                member.phone(),
                member.picture(),
                member.role(),
                member.createdAt(),
                member.modifiedAt()
        );
    }
}
