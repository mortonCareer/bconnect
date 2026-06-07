package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreateCoworkerRequest;
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.core.domain.coworker.CoworkerRequestDetail;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.storage.coworker.CoworkerRequestEntity;

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

    public static CoworkerRequestDetail createDetail(Long id, Member member, Profile profile) {
        return new CoworkerRequestDetail(id, member, profile);
    }
}
