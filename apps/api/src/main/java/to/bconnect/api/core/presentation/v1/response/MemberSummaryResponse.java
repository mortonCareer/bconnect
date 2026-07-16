package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.storage.member.Role;

import java.time.Instant;

public record MemberSummaryResponse(
        Long id,
        String username,
        String name,
        String picture,
        Role role,
        Instant createdAt,
        Instant modifiedAt
) {
    public static MemberSummaryResponse of(Member member, String picture) {
        return new MemberSummaryResponse(
                member.id(),
                member.username(),
                member.name(),
                picture,
                member.role(),
                member.createdAt(),
                member.modifiedAt()
        );
    }
}
