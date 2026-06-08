package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.security.member.Member;

public record CoworkerRequestResponse(
        Long id,
        MemberSummaryResponse member
) {
    public static CoworkerRequestResponse of(Coworker detail, Member member) {
        return new CoworkerRequestResponse(
                detail.id(),
                MemberSummaryResponse.of(member)
        );
    }
}
