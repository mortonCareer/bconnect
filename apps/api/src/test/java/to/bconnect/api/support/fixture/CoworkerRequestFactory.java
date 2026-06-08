package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreateCoworkerRequest;
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.core.domain.coworker.CoworkerMember;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;

public class CoworkerRequestFactory {

    public static CoworkerRequest create(Long id, Long fromId, Long toId) {
        return new CoworkerRequest(id, fromId, toId);
    }

    public static CoworkerRequestEntity createEntity(Long fromId, Long toId) {
        return CoworkerRequestEntity.builder()
                .fromId(fromId)
                .toId(toId)
                .build();
    }

    public static CreateCoworkerRequest createRequest(Long toId) {
        return new CreateCoworkerRequest(toId);
    }

    public static CoworkerMember createDetail(Long id, Member member) {
        return new CoworkerMember(id, member);
    }
}
