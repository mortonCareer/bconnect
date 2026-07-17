package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.storage.member.Role;

import java.time.Instant;

public record MemberSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String username,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String picture,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Role role,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
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
