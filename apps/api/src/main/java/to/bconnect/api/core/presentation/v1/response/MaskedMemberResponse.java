package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.storage.member.Role;
import to.bconnect.api.security.member.Member;

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
