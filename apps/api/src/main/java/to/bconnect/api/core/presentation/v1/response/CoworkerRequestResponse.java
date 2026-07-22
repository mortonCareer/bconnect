package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.member.Member;

public record CoworkerRequestResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MemberSummaryResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ProfileSummaryResponse profile
) {
    public static CoworkerRequestResponse of(CoworkerRequest request, Member member, Profile profile, String picture) {
        return new CoworkerRequestResponse(
                request.id(),
                MemberSummaryResponse.of(member, picture),
                ProfileSummaryResponse.of(profile)
        );
    }
}
