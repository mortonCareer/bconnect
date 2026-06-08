package to.bconnect.api.core.domain.coworker;

import to.bconnect.api.storage.coworker.CoworkerEntity;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;

public record Coworker(
    Long id,
    Long memberId
) {
    public static Coworker of(CoworkerEntity entity, Long memberId) {
        return new Coworker(entity.getId(), memberId);
    }

    public static Coworker of(CoworkerRequestEntity entity, Long memberId) {
        return new Coworker(entity.getId(), memberId);
    }
}
