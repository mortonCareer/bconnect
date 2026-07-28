package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;

public class CoworkerRequestFactory {

    public static CoworkerRequest domain(Long id, Long memberId) {
        return new CoworkerRequest(id, memberId);
    }

    public static CoworkerRequestEntity entity(Long fromId, Long toId) {
        return new CoworkerRequestEntity(fromId, toId);
    }
}
