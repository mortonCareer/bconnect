package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.coworker.CoworkerProfile;
import to.bconnect.api.security.member.MaskedMemberResponse;

public record CoworkerRequestResponse(
        Long id,
        MaskedMemberResponse member,
        ProfileResponse profile
) {
    public static CoworkerRequestResponse of(CoworkerProfile detail) {
        return new CoworkerRequestResponse(
                detail.id(),
                MaskedMemberResponse.of(detail.member()),
                ProfileResponse.of(detail.profile())
        );
    }
}
