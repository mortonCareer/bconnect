package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.coworker.Coworker;
import so.morton.api.domain.member.Member;
import so.morton.api.storage.value.CoworkerStatus;

public record CoworkerResponse(
        Long id,
        MaskedMemberResponse member,
        CoworkerStatus status
) {
    public static CoworkerResponse of(Coworker coworker, Member member, CoworkerStatus status) {
        return new CoworkerResponse(
                coworker.id(),
                MaskedMemberResponse.of(member),
                status
        );
    }
}
