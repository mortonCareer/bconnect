package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.coworker.Coworker;
import so.morton.api.storage.value.CoworkerStatus;

public record CoworkerResponse(
        Long id,
        MaskedMemberResponse member,
        CoworkerStatus status
) {
    // TODO: Member, CoworkerStatus
    public static CoworkerResponse of(Coworker coworker) {
        return new CoworkerResponse(coworker.id(), null, null);
    }
}
