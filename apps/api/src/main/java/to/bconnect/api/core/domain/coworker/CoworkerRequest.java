package to.bconnect.api.core.domain.coworker;

import to.bconnect.api.core.storage.coworker.CoworkerRequestEntity;


public record CoworkerRequest(
    Long id,
    Long fromId,
    Long toId
) {
    public static CoworkerRequest of(CoworkerRequestEntity entity) {
        return new CoworkerRequest(
                entity.getId(),
                entity.getFromId(),
                entity.getToId()
        );
    }
}
