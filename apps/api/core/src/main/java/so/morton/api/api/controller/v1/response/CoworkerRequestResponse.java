package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.coworker.CoworkerRequestDetail;

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
