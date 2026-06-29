package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerStatus;

public record CoworkerResponse(
        Long id,
        MemberSummaryResponse member,
        ProfileSummaryResponse profile,
        CoworkerStatus status
) {
    public static CoworkerResponse of(Coworker coworker, Member member, Profile profile, CoworkerStatus status, String picture) {
        return new CoworkerResponse(
                coworker.id(),
                MemberSummaryResponse.of(member, picture),
                profile == null ? null : ProfileSummaryResponse.of(profile),
                status
        );
    }
}
