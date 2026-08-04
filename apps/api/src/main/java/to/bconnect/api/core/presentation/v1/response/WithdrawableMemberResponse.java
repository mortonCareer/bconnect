package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.member.Member;

public record WithdrawableMemberResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String username,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String picture
) {
    public static WithdrawableMemberResponse of(Member member, String picture) {
        return new WithdrawableMemberResponse(
                member.id(),
                member.username(),
                member.name(),
                picture
        );
    }
}
