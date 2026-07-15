package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.storage.member.Role;

import java.time.OffsetDateTime;

public record MemberResponse(
        Long id,
        String username,
        String name,
        String phone,
        String picture,
        Role role,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
) {
    public static MemberResponse of(Member member, String picture) {
        return new MemberResponse(
                member.id(),
                member.username(),
                member.name(),
                member.phone(),
                picture,
                member.role(),
                member.createdAt(),
                member.modifiedAt()
        );
    }
}
