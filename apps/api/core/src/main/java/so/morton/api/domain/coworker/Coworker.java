package so.morton.api.domain.coworker;

import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.value.CoworkerStatus;


public record Coworker(
    Long id,
    Long fromId,
    Long toId,
    CoworkerStatus status
) {
    public static Coworker of(CoworkerEntity entity) {
        return new Coworker(
                entity.getId(),
                entity.getFromId(),
                entity.getToId(),
                entity.getStatus()
        );
    }
}
