package so.morton.api.domain.coworker;

import so.morton.api.storage.domain.coworker.CoworkerRequestEntity;


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
