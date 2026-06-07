package to.bconnect.api.presentation.v1.response;

import to.bconnect.api.domain.coworker.CoworkerRequestDetail;
import to.bconnect.api.security.member.MaskedMemberResponse;

public record CoworkerRequestResponse(
        Long id,
        MaskedMemberResponse member,
        ProfileResponse profile
) {
    public static CoworkerRequestResponse of(CoworkerRequestDetail detail) {
        return new CoworkerRequestResponse(
                detail.id(),
                MaskedMemberResponse.of(detail.member()),
                ProfileResponse.of(detail.profile())
        );
    }
}
