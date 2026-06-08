package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.coworker.CoworkerMember;

public record CoworkerRequestResponse(
        Long id,
        MaskedMemberResponse member
) {
    public static CoworkerRequestResponse of(CoworkerMember detail) {
        return new CoworkerRequestResponse(
                detail.id(),
                MaskedMemberResponse.of(detail.member())
        );
    }
}
