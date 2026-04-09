package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.member.Member;

import java.time.LocalDateTime;

public record MaskedMemberResponse(
        Long id,
        String username,
        String name,
        String picture,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static MaskedMemberResponse of(Member member) {
        return new MaskedMemberResponse(
                member.id(),
                member.username(),
                member.name(),
                member.picture(),
                member.createdAt(),
                member.modifiedAt()
        );
    }
}
