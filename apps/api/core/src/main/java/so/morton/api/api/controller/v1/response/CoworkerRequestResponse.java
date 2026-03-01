package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.coworker.CoworkerRequest;


public record CoworkerRequestResponse(
        Long id,
        Long fromId,
        Long toId
) {
    public static CoworkerRequestResponse of(CoworkerRequest request) {
        return new CoworkerRequestResponse(
                request.id(),
                request.fromId(),
                request.toId()
        );
    }
}
