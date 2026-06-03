package to.bconnect.api.api.controller.v1.response;

import to.bconnect.api.domain.coworker.Coworker;
import to.bconnect.api.domain.member.Member;
import to.bconnect.api.storage.common.value.CoworkerStatus;

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
