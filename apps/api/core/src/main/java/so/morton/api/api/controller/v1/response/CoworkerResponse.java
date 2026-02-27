package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.coworker.Coworker;


public record CoworkerResponse(
        Long id,
        Long minId,
        Long maxId
) {
    public static CoworkerResponse of(Coworker coworker) {
        return new CoworkerResponse(
                coworker.id(),
                coworker.minId(),
                coworker.maxId()
        );
    }
}
