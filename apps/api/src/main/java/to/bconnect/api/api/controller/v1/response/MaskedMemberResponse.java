package to.bconnect.api.api.controller.v1.response;

import to.bconnect.api.domain.member.Member;
import to.bconnect.api.storage.common.value.Role;

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
