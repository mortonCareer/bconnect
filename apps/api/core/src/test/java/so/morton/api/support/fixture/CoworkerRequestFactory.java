package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreateCoworkerRequestRequest;
import so.morton.api.domain.coworker.CoworkerRequest;
import so.morton.api.domain.coworker.CoworkerRequestDetail;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.profile.Profile;
import so.morton.api.storage.domain.coworker.CoworkerRequestEntity;

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

    public static CreateCoworkerRequestRequest createRequest(Long toId) {
        return new CreateCoworkerRequestRequest(toId);
    }

    public static CoworkerRequestDetail createDetail(Long id, Member member, Profile profile) {
        return new CoworkerRequestDetail(id, member, profile);
    }
}
