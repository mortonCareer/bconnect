package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.coworker.Coworker;

public record CoworkerRequestResponse(
        Long id,
        MaskedMemberResponse member
) {
    public static CoworkerRequestResponse of(Coworker detail) {
        return new CoworkerRequestResponse(
                detail.id(),
                MaskedMemberResponse.of(detail.member())
        );
    }
}
