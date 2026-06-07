package to.bconnect.api.presentation.v1.response;

import to.bconnect.api.domain.coworker.Coworker;
import to.bconnect.api.security.member.MaskedMemberResponse;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.value.CoworkerStatus;

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
