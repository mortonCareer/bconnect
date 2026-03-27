package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreateCoworkerRequest;
import so.morton.api.domain.coworker.CoworkerRequest;
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

    public static CreateCoworkerRequest createRequest(Long toId) {
        return new CreateCoworkerRequest(toId);
    }
}
