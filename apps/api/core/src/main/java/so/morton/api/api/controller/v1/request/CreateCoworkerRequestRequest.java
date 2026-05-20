package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotNull;

public record CreateCoworkerRequestRequest(
        @NotNull Long toId
) {}
