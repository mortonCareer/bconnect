package so.morton.api.api.controller.v1.response;

import so.morton.api.storage.value.CoworkerStatus;

public record CoworkerResponse(
        Long id,
        MaskedMemberResponse member,
        CoworkerStatus status
) {}
