package to.bconnect.api.core.domain.coworker;

public record CoworkerRequestedEvent(
        Long requestId,
        Long fromId,
        Long toId
) { }
