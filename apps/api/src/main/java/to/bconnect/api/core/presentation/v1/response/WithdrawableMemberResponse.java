package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.storage.member.Role;

import java.time.Instant;

public record WithdrawableMemberResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String username,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String picture,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Role role,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Instant modifiedAt
) {
    public static WithdrawableMemberResponse of(Member member, String picture) {
        return new WithdrawableMemberResponse(
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
