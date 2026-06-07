package to.bconnect.api.security.member;

import to.bconnect.api.core.storage.member.Role;

import java.time.LocalDateTime;

public record MaskedMemberResponse(
        Long id,
        String username,
        String name,
        String picture,
        Role role,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static MaskedMemberResponse of(Member member) {
        return new MaskedMemberResponse(
                member.id(),
                member.username(),
                member.name(),
                member.picture(),
                member.role(),
                member.createdAt(),
                member.modifiedAt()
        );
    }
}
