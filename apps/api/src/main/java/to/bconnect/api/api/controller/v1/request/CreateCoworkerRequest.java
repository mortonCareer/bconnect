package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotNull;

public record CreateCoworkerRequest(
        @NotNull Long toId
) {}
