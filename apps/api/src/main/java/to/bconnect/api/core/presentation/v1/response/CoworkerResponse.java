package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.storage.coworker.CoworkerStatus;

public record CoworkerResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MemberSummaryResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ProfileSummaryResponse profile,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CoworkerStatus status
) {
    public static CoworkerResponse of(Coworker coworker, Member member, Profile profile, CoworkerStatus status, String picture) {
        return new CoworkerResponse(
                coworker.id(),
                MemberSummaryResponse.of(member, picture),
                ProfileSummaryResponse.of(profile),
                status
        );
    }
}
