package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.coworker.Coworker;
import so.morton.api.storage.value.CoworkerStatus;


public record CoworkerResponse(
        Long id,
        Long fromId,
        Long toId,
        CoworkerStatus status
) {
    public static CoworkerResponse of(Coworker coworker) {
        return new CoworkerResponse(
                coworker.id(),
                coworker.fromId(),
                coworker.toId(),
                coworker.status()
        );
    }
}
