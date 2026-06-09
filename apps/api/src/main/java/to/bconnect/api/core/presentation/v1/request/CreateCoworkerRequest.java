package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotNull;

public record CreateCoworkerRequest(
        @NotNull Long toId
) {}
