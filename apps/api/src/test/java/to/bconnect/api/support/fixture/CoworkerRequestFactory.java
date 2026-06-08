package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreateCoworkerRequest;
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;

public class CoworkerRequestFactory {

    public static CoworkerRequest create(Long id, Member member) {
        return new CoworkerRequest(id, member);
    }

    public static CoworkerRequestEntity createEntity(Long fromId, Long toId) {
        return new CoworkerRequestEntity(fromId, toId);
    }

    public static CreateCoworkerRequest createRequest(Long toId) {
        return new CreateCoworkerRequest(toId);
    }

    public static Coworker createDetail(Long id, Long memberId) {
        return new Coworker(id, memberId);
    }
}
