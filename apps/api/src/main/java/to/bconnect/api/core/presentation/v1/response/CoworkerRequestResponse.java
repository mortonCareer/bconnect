package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.security.member.Member;

public record CoworkerRequestResponse(
        Long id,
        MemberSummaryResponse member,
        ProfileSummaryResponse profile
) {
    public static CoworkerRequestResponse of(CoworkerRequest request, Member member, Profile profile, String picture) {
        return new CoworkerRequestResponse(
                request.id(),
                MemberSummaryResponse.of(member, picture),
                profile == null ? null : ProfileSummaryResponse.of(profile)
        );
    }
}
