package to.bconnect.api.core.domain.coworker;

import to.bconnect.api.storage.coworker.CoworkerRequestEntity;


public record CoworkerRequest(
    Long id,
    Long memberId
) {
    public static CoworkerRequest of(CoworkerRequestEntity entity, Long memberId) {
        return new CoworkerRequest(entity.getId(), memberId);
    }
}
