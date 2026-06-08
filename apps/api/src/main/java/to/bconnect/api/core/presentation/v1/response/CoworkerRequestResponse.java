package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.security.member.Member;

public record CoworkerRequestResponse(
        Long id,
        MemberSummaryResponse member
) {
    public static CoworkerRequestResponse of(CoworkerRequest request, Member member) {
        return new CoworkerRequestResponse(
                request.id(),
                MemberSummaryResponse.of(member)
        );
    }
}
