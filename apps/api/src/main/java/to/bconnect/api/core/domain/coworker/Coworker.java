package to.bconnect.api.core.domain.coworker;

import to.bconnect.api.core.storage.coworker.CoworkerEntity;


public record Coworker(
    Long id,
    Long minId,
    Long maxId
) {
    public static Coworker of(CoworkerEntity entity) {
        return new Coworker(
                entity.getId(),
                entity.getMinId(),
                entity.getMaxId()
        );
    }
}
